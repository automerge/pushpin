import React from 'react'
import PropTypes from 'prop-types'
import CodeMirror from 'codemirror'
import DiffMatchPatch from 'diff-match-patch'
import Debug from 'debug'

const log = Debug('pushpin:code')

export default class CodeMirrorEditor extends React.PureComponent {
  static propTypes = {
    text: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }

  editorRef = null

  state = { text: null }

  // When the components mounts, and we therefore have refs to the DOM,
  // set up the editor.
  componentDidMount() {
    log('componentDidMount')

    // The props after `autofocus` are needed to get an editor that resizes
    // according to the size of the text, without scrollbars or wrapping.
    this.codeMirror = CodeMirror(this.editorRef, {
      autofocus: this.props.uniquelySelected,
      lineNumbers: true,
      lineWrapping: false,
      scrollbarStyle: 'null',
      viewportMargin: Infinity,
    })
    this.codeMirror.on('change', this.onCodeMirrorChange)

    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange(this.onDocChange)
  }

  // Transform declarative React selection prop into imperative focus changes
  // in the editor.
  componentWillReceiveProps(props) {
    if (!this.codeMirror) {
      return
    }
    this.ensureFocus(props.uniquelySelected)
  }

  // Ensure the CodeMirror editor is focused if we expect it to be.
  ensureFocus(uniquelySelected) {
    if (uniquelySelected && !this.codeMirror.hasFocus()) {
      log('ensureFocus.forceFocus')
      this.codeMirror.focus()
    }
  }

  // Observe changes to the editor and make corresponding updates to the
  // Automerge text.
  onCodeMirrorChange = (codeMirror, change) => {
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

    this.handle.change((doc) => {
      if (removedLength > 0) {
        doc.text.splice(at, removedLength)
      }

      if (addedText.length > 0) {
        doc.text.insertAt(at, ...addedText.split(''))
      }
    })
  }

  // Transform updates from the Automerge text into imperative text changes
  // in the editor.
  onDocChange = doc => {
    const { text } = doc

    // Short circuit if the text didn't change. This happens when a prop
    // besides text changed.
    if (this.state.text === text) {
      return
    }
    // Short circuit if the text has not loaded yet.
    if (!text) {
      return
    }

    this.setState({ text })

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

  setEditorRef(e) {
    this.editorRef = e
  }

  onKeyDown = e => {
    e.stopPropagation()
  }

  render() {
    log('render')

    return (
      <div className="CodeMirrorEditor" onKeyDown={this.onKeyDown}>
        <div
          id={`editor-${this.props.docId}`}
          className="CodeMirrorEditor__editor"
          ref={this.setEditorRef}
        />
      </div>
    )
  }
}
