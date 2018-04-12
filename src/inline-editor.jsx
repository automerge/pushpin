import React from 'react'
import { connect } from 'react-redux'
import {Editor} from 'draft-js'
import { CARD_EDITOR_CHANGED } from './action-types'

const styles = {
  fontFamily: '\'Helvetica\', sans-serif',
  fontSize: 14,
  color: '#090909',
  padding: 0,
  margin: 0,
  cursor: 'text',
  width: '100%',
  height: '100%',
}

class InlineEditorPresentation extends React.Component {
  constructor(props) {
    super(props)
    this.state = {editorState: props.editorState}
    this.onChange = (editorState) => {
      this.setState({editorState: editorState})
      props.onChange(props.cardId, editorState)
    }
    this.focus = () => {
      this.refs.editor.focus()
    }
  }

  render() {
    return (
      <div style={styles} onClick={this.focus}>
        <Editor
          editorState={this.state.editorState}
          onChange={this.onChange}
          ref='editor'
        />
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onChange: (id, editorState) => {
      dispatch({type: CARD_EDITOR_CHANGED, id: id, editorState: editorState })
    }
  }
}

const InlineEditor = connect(null, mapDispatchToProps)(InlineEditorPresentation)

export default InlineEditor
