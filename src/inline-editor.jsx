import React from 'react'
import { connect } from 'react-redux'
import { Editor} from 'draft-js'
import Fs from 'fs'
import Jimp from 'jimp'
import { CARD_EDITOR_CHANGED, CARD_SELECTED, CLEAR_SELECTIONS, CARD_TEXT_RESIZED, CARD_FILE_INLINED } from './action-types'

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
    this.onTextResized = (height) => {
      props.onTextResized(props.cardId, height)
    }
  }

  componentDidMount() {
    if (this.props.createFocus) {
      this.focus()
    }
  }

  componentDidUpdate() {
    this.onTextResized(this.refs.editorWrapper.clientHeight)
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

const filePat = /^(\/\S+\.(jpg|jpeg|png|gif))\n$/

const mapDispatchToProps = (dispatch) => {
  return {
    onChange: (id, editorState) => {
      dispatch({type: CARD_EDITOR_CHANGED, id: id, editorState: editorState })
      const plainText = editorState.getCurrentContent().getPlainText('\n')
      const filePatMatch = filePat.exec(plainText)
      if (!filePatMatch) {
        return
      }
      const path = filePatMatch[1]
      Fs.stat(path, (err, stat) => {
        if (err || !stat.isFile()) {
          console.log('No file found?', err)
          return
        }
        Jimp.read(path, function (err, img) {
          if (err) {
            console.log('Error loading image?', err)
            return
          }
          const width = img.bitmap.width
          const height = img.bitmap.height
          dispatch({type: CARD_FILE_INLINED, id: id, path: path, width: width, height: height})
        })
      })
    },
    onSelected: (id) => {
      dispatch({type: CLEAR_SELECTIONS})
      dispatch({type: CARD_SELECTED, id: id})
    },
    onTextResized: (id, height) => {
      dispatch({type: CARD_TEXT_RESIZED, id: id, height: height})
    }
  }
}

const InlineEditor = connect(null, mapDispatchToProps)(InlineEditorPresentation)

export default InlineEditor
