import React from 'react'
import { connect } from 'react-redux'
import ReactMarkdown from 'react-markdown'
import { Editor } from 'slate-react'
import Plain from 'slate-plain-serializer'
import Debug from 'debug'

import { maybeInlineFile } from '../model'
import { CARD_TEXT_CHANGED, CARD_UNIQUELY_SELECTED, CARD_TEXT_RESIZED, CARD_DELETED } from '../action-types'

const log = Debug('pushpin:inline-editor')

class InlineEditorPresentation extends React.PureComponent {
  constructor(props) {
    log('constructor')
    super(props)
    this.state = {value: Plain.deserialize(props.text)}
    this.lastLocalHeight = null

    this.onChange = this.onChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
  }

  componentDidMount() {
    log('componentDidMount')
    this.ensureFocus()
    this.checkHeight()
  }

  componentDidUpdate() {
    log('componentDidUpdate')
    this.ensureFocus()
    this.checkHeight()
  }

  componentWillReceiveProps(props) {
    log('componentWillReceiveProps')
    if (this.props.selected && !props.selected) {
      this.props.dispatch({type: CARD_TEXT_CHANGED, id: this.props.cardId, text: Plain.serialize(this.state.value) })
      maybeInlineFile(this.props.dispatch, this.props.cardId, this.props.text)
    } else if (!props.selected) {
      this.setState({value: Plain.deserialize(props.text)})
    }
  }

  ensureFocus() {
    if (this.props.selected && !this.state.value.isFocused) {
      log('forceFocus')
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
        this.props.dispatch({type: CARD_TEXT_RESIZED, id: this.props.cardId, height: height})
      }
    }
  }

  onKeyDown(e, change) {
    log('onKeyDown')

    if (e.key !== 'Backspace') {
      return
    }
    const text = Plain.serialize(this.state.value)
    if (text != '') {
      return
    }
    e.preventDefault()
    this.props.dispatch({type: CARD_DELETED, id: this.props.cardId})
  }

  onChange({ value }) {
    log('onChange')
    this.setState({value: value})
  }

  render() {
    log('render')

    if (this.props.selected) {
      return (
        <div
          className='editorWrapper'
          ref='editorWrapper'
        >
          <Editor
            value={this.state.value}
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
            ref='editor'
          />
        </div>
      )
    } else {
      return (
        <div
          className='renderer'
          ref='renderer'
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
  return { dispatch }
}

const InlineEditor = connect(null, mapDispatchToProps)(InlineEditorPresentation)

export default InlineEditor
