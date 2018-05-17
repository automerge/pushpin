import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { RIEInput } from 'riek'

import Loop from '../loop'
import * as Model from '../model'
import HashForm from './hash-form'

const log = Debug('pushpin:title-bar')

export default class TitleBar extends React.PureComponent {
  static propTypes = {
    formDocId: PropTypes.string.isRequired,
    // activeDocId: PropTypes.string.isRequired,
    requestedDocId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.onChange = this.onChangeTitle.bind(this)
    this.onSubmit = this.onChangeBoardBackgroundColor.bind(this)
  }

  onChangeTitle(newState) {
    log('onChangeTitle')
    Loop.dispatch(Model.setTitle, newState)
  }

  onChangeBoardBackgroundColor(color) {
    log('onChangeBoardBackgroundColor')
    Loop.dispatch(Model.setBackgroundColor, { backgroundColor: color.hex })
  }

  onSubmit(e) {
    log('onSubmit')
    e.preventDefault()
  }

  render() {
    log('render')

    return (
      <div className="TitleBar">
        <img
          className="TitleBar__logo"
          alt="pushpin logo"
          src="pushpinIcon_Standalone.svg"
          width="28"
          height="28"
        />
        <RIEInput
          value={this.props.title}
          change={this.onChangeTitle}
          propName="title"
          className="TitleBar__titleText"
          classLoading="TitleBar__titleText--loading"
          classInvalid="TitleBar__titleText--invalid"
        />

        <HashForm
          formDocId={this.props.formDocId}
          // activeDocId={this.props.activeDocId}
          requestedDocId={this.props.requestedDocId}
        />
      </div>
    )
  }
}
