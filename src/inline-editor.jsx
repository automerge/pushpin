import React from 'react'
import { connect } from 'react-redux'
import ReactMarkdown from 'react-markdown'
import { Editor } from 'slate-react'
import Plain from 'slate-plain-serializer'

import { maybeInlineFile } from './model'
import { CARD_TEXT_CHANGED, CARD_UNIQUELY_SELECTED, CARD_TEXT_RESIZED, CARD_IMAGE_INLINED, CARD_PDF_INLINED, CARD_DELETED } from './action-types'

class InlineEditorPresentation extends React.Component {
  constructor(props) {
    console.log('editor.constructor')
    super(props)
    this.state = {value: Plain.deserialize(props.text)}
    this.lastLocalHeight = null
  }

  componentDidMount() {
    console.log('editor.didMount')
    this.ensureFocus()
    this.checkHeight()
  }

  componentDidUpdate() {
    console.log('editor.didUpdate')
    this.ensureFocus()
    this.checkHeight()
  }

  ensureFocus() {
    if (this.props.selected && !this.state.value.isFocused) {
      console.log('editor.forceFocus')
      const newValue = this.state.value.change().focus().value
      this.setState({value: newValue})
    }
  }

  checkHeight() {
    const localHeight = this.props.selected ? this.refs.editorWrapper.clientHeight : null
    if (this.lastLocalHeight != localHeight) {
      this.props.onLocalHeight(localHeight)
      this.lastLocalHeight = localHeight
    }

    if (!this.props.selected) {
      const height = this.refs.renderer.clientHeight
      if (this.props.cardHeight != height) {
        this.props.onTextResized(this.props.cardId, height)
      }
    }
  }

  onKeyDown(e, change) {
    console.log('editor.onKeyDown')

    if (e.key !== 'Backspace') {
      return
    }
    const text = Plain.serialize(this.state.value)
    if (text != '') {
      return
    }
    e.preventDefault()
    this.props.onDeleted(this.props.cardId)
  }

  componentWillReceiveProps(props) {
    console.log('editor.willReceiveProps')

    if (this.props.selected && !props.selected) {
      this.props.onTextChanged(this.props.cardId, Plain.serialize(this.state.value))
    } else if (!props.selected) {
      this.setState({value: Plain.deserialize(props.text)})
    }
  }

  onChange({ value }) {
    console.log('editor.onChange')
    this.setState({value: value})
  }

  render() {
    console.log('editor.render')

    if (this.props.selected) {
      return (
        <div
          className={'editorWrapper'}
          ref={'editorWrapper'}
        >
          <Editor
            value={this.state.value}
            onChange={this.onChange.bind(this)}
            onKeyDown={this.onKeyDown.bind(this)}
            ref={'editor'}
          />
        </div>
      )
    } else {
      return (
        <div
          className={'renderer'}
          ref={'renderer'}
        >
          <ReactMarkdown
            source={this.props.text}
          />
        </div>
      )
    }
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onTextChanged: (id, text) => {
      console.log('editor.onTextChanged')
      dispatch({type: CARD_TEXT_CHANGED, id: id, text: text })
      maybeInlineFile(dispatch, id, text)
    },
    onSelected: (id) => {
      console.log('editor.onSelected')
      dispatch({type: CARD_UNIQUELY_SELECTED, id: id})
    },
    onDeleted: (id) => {
      console.log('editor.onDeleted')
      dispatch({type: CARD_DELETED, id: id})
    },
    onTextResized: (id, height) => {
      console.log('editor.onTextResized')
      dispatch({type: CARD_TEXT_RESIZED, id: id, height: height})
    },
  }
}

const InlineEditor = connect(null, mapDispatchToProps)(InlineEditorPresentation)

export default InlineEditor
