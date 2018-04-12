import React from 'react'
import {Editor, EditorState} from 'draft-js'

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

class InlineEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.focus = () => this.editor.focus();
    this.onChange = (editorState) => this.setState({editorState});
  }

  render() {
    return (
      <div style={styles} onClick={this.focus}>
        <Editor
          editorState={this.state.editorState}
          onChange={(editorState) => { this.onChange(editorState) }}
          ref={(ref) => this.editor = ref}
        />
      </div>
    );
  }
}

export default InlineEditor
