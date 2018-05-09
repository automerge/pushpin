import React from 'react'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import { Editor } from 'slate-react'
import Plain from 'slate-plain-serializer'
import Debug from 'debug'

import Loop from '../loop'
import * as Model from '../model'

const log = Debug('pushpin:inline-editor')

class InlineEditor extends React.PureComponent {
  constructor(props) {
    log('constructor')
    super(props)
    this.state = { value: Plain.deserialize(props.text) }
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
      Loop.dispatch(Model.cardTextChanged, {
        id: this.props.cardId,
        text: Plain.serialize(this.state.value)
      })
      Model.maybeInlineFile(this.props.cardId, this.props.text)
    } else if (!props.selected) {
      this.setState({ value: Plain.deserialize(props.text) })
    }
  }

  ensureFocus() {
    if (this.props.selected && !this.state.value.isFocused) {
      log('forceFocus')
      const newValue = this.state.value.change().focus().value
      this.setState({ value: newValue })
    }
  }

  checkHeight() {
    const localHeight = this.props.selected ? this.editorWrapperRef.clientHeight : null
    if (this.lastLocalHeight !== localHeight) {
      this.props.onLocalHeight(localHeight)
      this.lastLocalHeight = localHeight
    }

    if (!this.props.selected) {
      const height = this.rendererRef.clientHeight
      if (this.props.cardHeight !== height) {
        Loop.dispatch(Model.cardTextResized, { id: this.props.cardId, height })
      }
    }
  }

  onKeyDown(e, change) {
    log('onKeyDown')

    if (e.key !== 'Backspace') {
      return
    }
    const text = Plain.serialize(this.state.value)
    if (text !== '') {
      return
    }
    e.preventDefault()
    Loop.dispatch(Model.cardDeleted, { id: this.props.cardId })
  }

  onChange({ value }) {
    log('onChange')
    this.setState({ value })
  }

  render() {
    log('render')

    if (this.props.selected) {
      return (
        <div
          className="editorWrapper"
          ref={(e) => { this.editorWrapperRef = e }}
        >
          <Editor
            value={this.state.value}
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
          />
        </div>
      )
    }
    return (
      <div
        className="renderer"
        ref={(e) => { this.rendererRef = e }}
      >
        <ReactMarkdown
          source={this.props.text}
        />
      </div>
    )
  }
}

InlineEditor.propTypes = {
  text: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  cardId: PropTypes.string.isRequired,
  cardHeight: PropTypes.number.isRequired,
  onLocalHeight: PropTypes.func.isRequired,

}

export default InlineEditor
