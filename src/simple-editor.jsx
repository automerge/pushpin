import React from 'react'
import { connect } from 'react-redux'
import Rnd from 'react-rnd'
import classNames from 'classnames'
import { Editor, EditorState } from 'draft-js'
import Draggable, { DraggableCore } from 'react-draggable'

class SimpleEditorPresentation extends React.Component {
  constructor(props) {
    super(props)
    this.state = {editorState: props.editorState || EditorState.createEmpty()}
    this.onChange = (editorState) => {
      console.log('onChange')
      this.setState({editorState: editorState})
    }
    this.focus = () => {
      console.log('focus')
      this.refs.editor.focus()
    }
  }

  render() {
    return (
      <div className='board'>
        <DraggableCore
          allowAnyClick={false}
          disabled={false}
          enableUserSelectHack={false}
          onStart={(e, d) => console.log('onStart', e, d)}
          onDrag={(e, d) => console.log('onDrag', e, d)}
          onStop={(e, d) => console.log('onStop', e, d)}
          onMouseDown={(e) => console.log('onMouseDown', e)}
        >
          <div
            className='card'
            style={{ width: 300, height: 200}}>
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
          </div>
        </DraggableCore>
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {}
}

const SimpleEditor = connect(null, mapDispatchToProps)(SimpleEditorPresentation)

export default SimpleEditor
