import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { RIEInput } from 'riek'

import Loop from '../loop'
import * as Model from '../model'

const log = Debug('pushpin:title-bar')

class TitleBar extends React.PureComponent {
  constructor(props) {
    super(props)
    log('constructor')

    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onChangeTitle(e) {
    log('onChangeTitle')
    const title = e.target.value
    Loop.dispatch(Model.setTitle, { title })
  }

  onChangeBoardBackgroundColor(e) {
    log('onChangeTitle')
    const title = e.target.value
    Loop.dispatch(Model.setTitle, { title })
  }

  onSubmit(e) {
    log('onSubmit')
    e.preventDefault()
  }

  render() {
    log('render')

    return (
      <div className="TitleBar">
        <RIEInput
          value={this.props.title}
          change={this.onChangeTitle}
          propName="title"
          className={this.state.highlight ? 'editable' : ''}
          classLoading="loading"
          classInvalid="invalid"
          isDisabled={this.state.isDisabled}
        />
        <RIEInput
          value={this.props.boardBackgroundColor}
          change={this.onChangeBoardBackgroundColor}
          propName="boardBackgroundColor"
          className={this.state.highlight ? 'editable' : ''}
          classLoading="loading"
          classInvalid="invalid"
          isDisabled={this.state.isDisabled}
        />
      </div>
    )
  }
}

TitleBar.propTypes = {
  title: PropTypes.string.isRequired,
  boardBackgroundColor: PropTypes.string.isRequired
}

export default TitleBar
