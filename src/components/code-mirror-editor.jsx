import React from 'react'
import PropTypes from 'prop-types'
import CodeMirror from 'codemirror'
import DiffMatchPatch from 'diff-match-patch'
import Debug from 'debug'
import Automerge from 'automerge'
import ContentTypes from '../content-types'

const log = Debug('pushpin:code-mirror-editor')

// This is plain text note component with inline editing.
//
// It's a tricky component because it needs to bridge the functional-reactive
// world of React with the imperative world of the CodeMirror editor, as well
// as some data model mismatch between the Automerge.Text property and the
// CodeMirror instance.
//
// Key ideas:
// * The Automerge.Text property and the CodeMirror editor are seperate state,
//   but we sync them in both directions. It's not a pure one-way data flow
//   as we have elsewhere in the app.
// * When the user does a local change in the editor, we pick that up and
//   convert it into a corresponding Automerge.Text change. This causes
//   updates to go out to other clients.
// * When we see an Automerge.Text update, we apply changes to the editor to
//   converge the editor's contents to those indicated in the Automerge.Text.
// * Cursor state is managed only by CodeMirror. This means cursor state
//   definetly remains correct when the user does local editing. Also when we
//   apply remote ops to CodeMirror through its programtic editing APIs, the
//   editor should automatically do the right thing with the user's cursor.
//
// This component is not "pure" in the literal sense. But PureComponent still
// seems to give the right caching behaviour, so for now we'll extend from it.
export default class CodeMirrorEditor extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      text: PropTypes.object,
    }).isRequired,
    docId: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    uniquelySelected: PropTypes.bool.isRequired,
  }

  static initializeDocument(onChange, { text }) {
    onChange(d => {
      d.text = new Automerge.Text()
      if (text) {
        d.text.insertAt(0, ...text.split(''))
      }
    })
  }


  constructor(props) {
    log('constructor')
    super(props)
    this.onBackspace = this.onBackspace.bind(this)
    this.onCodeMirrorChange = this.onCodeMirrorChange.bind(this)
    this.setEditorRef = this.setEditorRef.bind(this)
    this.editorRef = null
    this.mounted = false
  }

  // When the components mounts, and we therefore have refs to the DOM,
  // set up the editor.
  componentDidMount() {
    log('componentDidMount')
    // The props after `autofocus` are needed to get an editor that resizes
    // according to the size of the text, without scrollbars or wrapping.
    this.codeMirror = CodeMirror(this.editorRef, {
      extraKeys: { Backspace: this.onBackspace },
      autofocus: this.props.uniquelySelected,
      lineNumbers: false,
      lineWrapping: true,
      scrollbarStyle: 'null',
      viewportMargin: Infinity,
    })
    if (this.props.doc.text) {
      this.codeMirror.setValue(this.props.doc.text.join(''))
    }
    this.codeMirror.on('change', this.onCodeMirrorChange)
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
  }

  // This is where we transform declarative updates from React into imperative
  // commands in the editor.
  componentWillReceiveProps(props) {
    // It's possible to receive props before mounting - in that case just
    // accept without action and the editor will start with the right contents.
    if (this.mounted) {
      this.ensureContents(props.doc)
      this.ensureFocus(props.uniquelySelected)
    }
  }

  // This is fired whenever we hit backspace while editing. If the editor is
  // empty, take this as a command to delete the card. Otherwise pass through
  // to the default editor behaviour.
  onBackspace(codeMirror) {
    log('onBackspace')
    if (codeMirror.getValue() === '') {
      // We want to avoid both Loop and using this.props.cardId (which we no longer have).
      // Loop.dispatch(Board.cardDeleted, { id: this.props.cardId })
    }
    return CodeMirror.Pass
  }

  // Observe changes to the editor and make corresponding updates to the
  // Automerge text.
  onCodeMirrorChange(codeMirror, change) {
    // We don't want to re-apply changes we already applied because of updates
    // from Automerge.
    if (change.origin === 'automerge') {
      return
    }

    log('onCodeMirrorChange')
    // Convert from CodeMirror coordinate space to Automerge text/array API.
    const at = codeMirror.indexFromPos(change.from)
    const removedLength = change.removed.join('\n').length
    const addedText = change.text.join('\n')
    this.cardTextChanged({ at, removedLength, addedText })
  }

  // When we get a new text prop, ensure that the editor contents reflect that.
  ensureContents(doc) {
    const { text } = doc

    // Short circuit if the text didn't change. This happens when a prop
    // besides text changed.
    if (this.props.doc === doc) {
      return
    }

    // Short circuit if we don't need to apply any changes to the editor. This
    // happens when we get a text update based on our own local edits.
    const oldStr = this.codeMirror.getValue()
    const newStr = text.join('')
    if (oldStr === newStr) {
      return
    }

    // Otherwise find the diff between the current and desired contents, and
    // apply corresponding editor ops to close them.
    log('forceContents')
    const dmp = new DiffMatchPatch()
    const diff = dmp.diff_main(oldStr, newStr)
    // The diff lib doesn't give indicies so we need to compute them ourself as
    // we go along.
    let at = 0
    for (let i = 0; i < diff.length; i += 1) {
      const [type, str] = diff[i]
      switch (type) {
        case DiffMatchPatch.DIFF_EQUAL: {
          at += str.length
          break
        }
        case DiffMatchPatch.DIFF_INSERT: {
          const fromPos = this.codeMirror.posFromIndex(at)
          this.codeMirror.replaceRange(str, fromPos, null, 'automerge')
          at += str.length
          break
        }
        case DiffMatchPatch.DIFF_DELETE: {
          const fromPos = this.codeMirror.posFromIndex(at)
          const toPos = this.codeMirror.posFromIndex(at + str.length)
          this.codeMirror.replaceRange('', fromPos, toPos, 'automerge')
          break
        }
        default: {
          throw new Error(`Did not expect diff type ${type}`)
        }
      }
    }
  }

  // Ensure the CodeMirror editor is focused if we expect it to be.
  ensureFocus(uniquelySelected) {
    if (uniquelySelected && !this.codeMirror.hasFocus()) {
      log('forceFocus')
      this.codeMirror.focus()
    }
  }

  // Update the Hypermerge document and rerender the component.
  cardTextChanged({ id, at, removedLength, addedText }) {
    this.props.onChange((d) => {
      if (removedLength > 0) {
        d.text.splice(at, removedLength)
      }

      if (addedText.length > 0) {
        d.text.insertAt(at, ...addedText.split(''))
      }
    })
  }

  setEditorRef(e) {
    this.editorRef = e
  }

  render() {
    log('render')

    return (
      <div className="CodeMirrorEditor">
        <div
          id={`editor-${this.props.docId}`}
          className="CodeMirrorEditor__editor"
          ref={this.setEditorRef}
        />
      </div>
    )
  }
}

ContentTypes.register({
  component: CodeMirrorEditor,
  type: 'text',
  name: 'Text',
  icon: 'sticky-note'
})
