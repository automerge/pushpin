import React from 'react'
import PropTypes from 'prop-types'
import CodeMirror from 'codemirror'
import DiffMatchPatch from 'diff-match-patch'
import Debug from 'debug'
import Automerge from 'automerge'
import { Handle } from 'hypermerge'

import ContentTypes from '../ContentTypes'
import { ContentProps } from './Content'

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

interface TextDoc {
  text?: Automerge.Text
}

interface State {
  text?: Automerge.Text
  doc?: TextDoc
}

interface UniquelySelectedContentProps extends ContentProps {
  uniquelySelected: boolean
}

export default class TextContent extends React.PureComponent<UniquelySelectedContentProps, State> {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired,
    uniquelySelected: PropTypes.bool,
  }

  static defaultProps = {
    uniquelySelected: false
  }

  static initializeDocument(editor: TextDoc, { text }) {
    editor.text = new Automerge.Text()
    if (text) {
      editor.text.insertAt(0, ...text.split(''))
    }
  }

  static minWidth = 6
  static minHeight = 2
  static defaultWidth = 12
  // no default height to allow it to grow
  static maxWidth = 24
  static maxHeight = 36


  private stallDelete: boolean = false // this should be on state?
  private handle?: Handle<TextDoc>
  private codeMirror: CodeMirror
  private editorRef = React.createRef()
  state: State = {}

  // When the components mounts, and we therefore have refs to the DOM,
  // set up the editor.
  componentDidMount = () => {
    log('componentDidMount')

    // The props after `autofocus` are needed to get an editor that resizes
    // according to the size of the text, without scrollbars or wrapping.
    this.codeMirror = CodeMirror(this.editorRef, {
      autofocus: this.props.uniquelySelected,
      lineNumbers: false,
      lineWrapping: true,
      scrollbarStyle: 'null',
      viewportMargin: Infinity,
    })
    this.codeMirror.on('change', this.onCodeMirrorChange)

    const { hypermergeUrl } = this.props
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onDocChange(doc))
  }

  componentWillUnmount = () => {
    this.handle && this.handle.close()
  }

  // Transform declarative React selection prop into imperative focus changes
  // in the editor.
  componentWillReceiveProps = (props) => {
    if (!this.codeMirror) {
      return
    }
    this.ensureFocus(props.uniquelySelected)
  }

  // Ensure the CodeMirror editor is focused if we expect it to be.
  ensureFocus = (uniquelySelected) => {
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

    this.handle && this.handle.change((doc) => {
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
  onDocChange = (doc) => {
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

  setEditorRef = (e) => {
    this.editorRef = e
  }

  onKeyDown = (e) => {
    // XXX: this stallDelete thing should probably be on state?
    if (e.key !== 'Backspace') {
      this.stallDelete = true
    }
    if (!this.stallDelete) {
      // we normally prevent deletion by stopping event propagation
      // but if the card is already empty and we hit delete, allow it
      return
    }
    if (e.key === 'Backspace' && this.state.text.length === 0) {
      this.stallDelete = false
    }

    e.stopPropagation()
  }

  handlePaste = (e) => {
    e.stopPropagation()
  }

  render = () => {
    log('render')

    return (
      <div className="CodeMirrorEditor" onKeyDown={this.onKeyDown}>
        <div
          id={`editor-${this.props.hypermergeUrl}`}
          className="CodeMirrorEditor__editor"
          ref={this.setEditorRef}
          onPaste={this.handlePaste}
        />
      </div>
    )
  }
}

ContentTypes.register({
  type: 'text',
  name: 'Text',
  icon: 'sticky-note',
  contexts: {
    workspace: TextContent,
    board: TextContent
  }
})
