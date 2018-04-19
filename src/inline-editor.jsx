import React from 'react'
import { connect } from 'react-redux'
import { Editor, getDefaultKeyBinding } from 'draft-js'

import { maybeInlineFile } from './model'
import { CARD_EDITOR_CHANGED, CARD_UNIQUELY_SELECTED, CARD_TEXT_RESIZED, CARD_IMAGE_INLINED, CARD_PDF_INLINED, CARD_DELETED } from './action-types'

class InlineEditorPresentation extends React.Component {
  constructor(props) {
    super(props)
    this.state = {editorState: props.editorState}
    this.onChange = (editorState) => {
      this.setState({editorState: editorState})
      props.onChange(props.cardId, editorState)
    }
    this.focus = (e) => {
      this.refs.editor.focus()
    }
    this.onTextResized = (height) => {
      props.onTextResized(props.cardId, height)
    }
    this.lastHeight = 0
  }

  componentDidMount() {
    this.checkEditorHeight()
    if (this.props.createFocus) {
      this.focus()
    }
  }

  componentDidUpdate() {
    this.checkEditorHeight()
  }

  checkEditorHeight() {
    const newHeight = this.refs.editorWrapper.clientHeight
    if (this.lastHeight != newHeight) {
      this.onTextResized(newHeight)
      this.lastHeight = newHeight
    }
  }

  checkForBackspaceDelete(e) {
    if (e.key !== 'Backspace') {
      return getDefaultKeyBinding(e)
    }
    const selectionState = this.state.editorState.getSelection()
    const firstLine = (this.state.editorState.getCurrentContent().getBlockMap().first().getKey() == selectionState.getFocusKey())
    if (!firstLine) {
      return getDefaultKeyBinding(e)
    }
    const startOfLine = (selectionState.getAnchorOffset() == 0)
    if (!startOfLine) {
      return getDefaultKeyBinding(e)
    }
    return 'backspace-delete-card'
  }

  doBackspaceDelete(command) {
    if (command !== 'backspace-delete-card') {
      return 'not-handled'
    }
    this.props.onDeleted(this.props.cardId)
    return 'handled'
  }

  render() {
    return (
      <div
        className='editorWrapper'
        onClick={this.focus}
        ref='editorWrapper'>
        <Editor
          className='editor'
          editorState={this.state.editorState}
          onChange={this.onChange}
          keyBindingFn={this.checkForBackspaceDelete.bind(this)}
          handleKeyCommand={this.doBackspaceDelete.bind(this)}
          ref='editor'
        />
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onChange: (id, editorState) => {
      console.log('inlineEditor.onChange.start')
      dispatch({type: CARD_EDITOR_CHANGED, id: id, editorState: editorState })
      maybeInlineFile(dispatch, id, editorState)
      console.log('inlineEditor.onChange.finish')
    },
    onSelected: (id) => {
      console.log('inlineEditor.onSelected.start')
      dispatch({type: CARD_UNIQUELY_SELECTED, id: id})
      console.log('inlineEditor.onSelected.finish')
    },
    onTextResized: (id, height) => {
      console.log('inlineEditor.onTextResized.start')
      dispatch({type: CARD_TEXT_RESIZED, id: id, height: height})
      console.log('inlineEditor.onTextResized.finish')
    },
    onDeleted: (id) => {
      console.log('inlineEditor.onDeleted.start')
      dispatch({type: CARD_DELETED, id: id})
      console.log('inlineEditor.onDeleted.finish')
    }
  }
}

const InlineEditor = connect(null, mapDispatchToProps)(InlineEditorPresentation)

export default InlineEditor
