import React from 'react'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import CodeMirror from 'codemirror'
import DiffMatchPatch from 'diff-match-patch'
import Debug from 'debug'

import Loop from '../loop'
import * as TextCard from '../models/text-card'
import * as Board from '../models/board'

const log = Debug('pushpin:code-mirror-editor')

const invisibleStyle = { visibility: 'hidden', position: 'absolute' }
const visibleStyle = { }

// This is a modal text editor / markdown rendering component, presenting one
// or the other to the user depending on if the card is uniquely selected on
// the board.
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
// * The component keeps both the editor and renderer elements up to date
//   at all times, but only displays one according to the current mode of the
//   card. This is used to calculate the height of both versions.
// * The height of a card is the greater of the editor height and renderer
//   height (it's usually the renderer). This prevents the card dimensions
//   from jumping around when you change modes.
//
// This component is not "pure" in the literal sense. But PureComponent still
// seems to give the right caching behaviour, so for now we'll extend from it.
export default class CodeMirrorEditor extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      text: PropTypes.object,
      objectId: PropTypes.string,
      join: PropTypes.func.isRequired,
    }).isRequired,
    uniquelySelected: PropTypes.bool.isRequired,
    cardId: PropTypes.string.isRequired,
    cardHeight: PropTypes.number.isRequired,
  }

  constructor(props) {
    log('constructor')
    super(props)
    this.onBackspace = this.onBackspace.bind(this)
    this.onCodeMirrorChange = this.onCodeMirrorChange.bind(this)
    this.onCodeMirrorRefresh = this.onCodeMirrorRefresh.bind(this)
    this.setEditorRef = this.setEditorRef.bind(this)
    this.setRendererRef = this.setRendererRef.bind(this)
  }

  // When the components mounts, and we therefore have refs to the DOM,
  // set up the editor.
  componentDidMount() {
    log('componentDidMount')
    // The props after `autofocus` are needed to get an editor that resizes
    // according to the size of the text, without scrollbars or wrapping.
    this.codeMirror = CodeMirror(this.editorRef, {
      extraKeys: { Backspace: this.onBackspace },
      value: this.props.doc.text.join(''),
      autofocus: this.props.uniquelySelected,
      lineNumbers: false,
      lineWrapping: true,
      scrollbarStyle: 'null',
      viewportMargin: Infinity,
    })
    this.codeMirror.on('change', this.onCodeMirrorChange)
    this.codeMirror.on('update', this.onCodeMirrorRefresh)
    this.checkHeight()
  }

  // This is where we transform declarative updates from React into imperative
  // commands in the editor.
  componentWillReceiveProps(props) {
    this.ensureContents(props.doc)
    this.ensureFocus(props.uniquelySelected)
  }

  // This is fired whenever we hit backspace while editing. If the editor is
  // empty, take this as a command to delete the card. Otherwise pass through
  // to the default editor behaviour.
  onBackspace(codeMirror) {
    log('onBackspace')
    if (codeMirror.getValue() === '') {
      Loop.dispatch(Board.cardDeleted, { id: this.props.cardId })
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
    Loop.dispatch(TextCard.cardTextChanged, { id: this.props.cardId, at, removedLength, addedText })
  }

  // This is called when the editor redraws, and therefore may have a new
  // height. So we check if we need to record that.
  onCodeMirrorRefresh(codeMirror) {
    this.checkHeight()
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

  // Ensure the height associated with the card is equal to the greater of
  // the {editor height, renderer height, min card height}.
  checkHeight() {
    const editorHeight = this.editorRef.clientHeight
    const rendererHeight = this.rendererRef.clientHeight
    const neededHeight = Math.max(
      editorHeight,
      rendererHeight
    )
    if (neededHeight !== this.props.cardHeight) {
      log('forceHeight', this.props.cardHeight, editorHeight, rendererHeight, neededHeight)
      Loop.dispatch(Board.cardResizeHeightRoundingUp, {
        id: this.props.cardId,
        height: neededHeight
      })
    }
  }

  // Helpers to set Refs.
  setEditorRef(e) {
    this.editorRef = e
  }
  setRendererRef(e) {
    this.rendererRef = e
  }

  // Render both the editor and renderer variants. Hide the one not active.
  // See class docs for the reasoning here.
  render() {
    log('render')

    return (
      <div className="CodeMirrorEditor">
        <div
          id={`editor-${this.props.cardId}`}
          className="CodeMirrorEditor__editor"
          style={this.props.uniquelySelected ? visibleStyle : invisibleStyle}
          ref={this.setEditorRef}
        />
        <div
          id={`renderer-${this.props.cardId}`}
          className="CodeMirrorEditor__renderer"
          style={this.props.uniquelySelected ? invisibleStyle : visibleStyle}
          ref={this.setRendererRef}
        >
          <ReactMarkdown
            source={this.props.doc.text.join('')}
          />
        </div>
      </div>
    )
  }
}
