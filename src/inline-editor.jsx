import React from 'react'
import { connect } from 'react-redux'
import {Editor} from 'draft-js'
import { CARD_EDITOR_CHANGED, CARD_SELECTED, CLEAR_SELECTIONS } from './action-types'

class InlineEditorPresentation extends React.Component {
  constructor(props) {
    super(props)
    this.state = {editorState: props.editorState}
    this.onChange = (editorState) => {
      this.setState({editorState: editorState})
      props.onChange(props.cardId, editorState)
    }
    this.focus = (e) => {
      if (e) {
        e.stopPropagation()
      }
      this.refs.editor.focus()
      props.onSelected(props.cardId)
    }
  }

  componentDidMount() {
    if (this.props.createFocus) {
      this.focus()
    }
  }

  componentDidUpdate() {
    console.log('update.refs', this.refs.editorWrapper.clientWidth, this.refs.editorWrapper.clientHeight)
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
      dispatch({type: CARD_EDITOR_CHANGED, id: id, editorState: editorState })
    },
    onSelected: (id) => {
      dispatch({type: CLEAR_SELECTIONS})
      dispatch({type: CARD_SELECTED, id: id})
    }
  }
}

const InlineEditor = connect(null, mapDispatchToProps)(InlineEditorPresentation)

export default InlineEditor
