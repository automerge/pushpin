import React from 'react'
import {Editor, EditorState} from 'draft-js'

class InlineEditor extends React.Component {
  constructor(ed) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.focus = () => this.editor.focus();
    this.onChange = (editorState) => this.setState({editorState});
  }

  render() {
    return (
      <div id='editorWrapper' style={styles.editorWrapper}>
        <div id='editor' style={styles.editor} onClick={this.focus}>
          <Editor
            editorState={this.state.editorState}
            onChange={(editorState) => { console.log(editorState.getCurrentContent().getPlainText('\n')); this.onChange(editorState) }}
            ref={(ref) => this.editor = ref}
          />
        </div>
      </div>
    );
  }
}

const styles = {
  editorWrapper: {
    fontFamily: '\'Helvetica\', sans-serif',
    fontSize: 12,
    padding: 10,
    width: 200,
    border: '1px solid #ccc'
  },
  editor: {
    cursor: 'text',
    minHeight: 80,
    padding: 5,
    border: '1px solid #ccc'
  }
 
}

export default InlineEditor
