import React from 'react'
import { Editor, EditorState } from 'draft-js'

class SimpleEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {editorState: props.editorState || EditorState.createEmpty()}
    this.onChange = (editorState) => {
      this.setState({editorState: editorState})
    }
    this.focus = () => {
      this.refs.editor.focus()
    }
  }

  componentDidMount() {
    this.focus()
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

export default SimpleEditor