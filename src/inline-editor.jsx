import React from 'react'
import { connect } from 'react-redux'
import { Editor} from 'draft-js'

import { maybeInlineFile } from './model'
import { CARD_EDITOR_CHANGED, CARD_SELECTED, CLEAR_SELECTIONS, CARD_TEXT_RESIZED, CARD_IMAGE_INLINED, CARD_PDF_INLINED } from './action-types'

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
      props.onSelected(props.cardId)
    }
    this.onTextResized = (height) => {
      props.onTextResized(props.cardId, height)
    }
    this.lastHeight = 0
  }

  componentDidMount() {
    if (this.props.createFocus) {
      this.focus()
    }
  }

  componentDidUpdate() {
    const newHeight = this.refs.editorWrapper.clientHeight
    if (this.lastHeight != newHeight) {
      this.onTextResized(newHeight)
      this.lastHeight = newHeight
    }
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
      dispatch({type: CLEAR_SELECTIONS})
      dispatch({type: CARD_SELECTED, id: id})
      console.log('inlineEditor.onSelected.finish')
    },
    onTextResized: (id, height) => {
      console.log('inlineEditor.onTextResized.start')
      dispatch({type: CARD_TEXT_RESIZED, id: id, height: height})
      console.log('inlineEditor.onTextResized.finish')
    }
  }
}

const InlineEditor = connect(null, mapDispatchToProps)(InlineEditorPresentation)

export default InlineEditor
