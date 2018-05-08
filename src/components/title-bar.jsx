import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { RIEInput } from 'riek'
import Dropdown, { DropdownContent, DropdownTrigger } from 'react-simple-dropdown'

import Loop from '../loop'
import * as Model from '../model'
import HashForm from './hash-form'
import ColorPicker from './color-picker'

const log = Debug('pushpin:title-bar')

class TitleBar extends React.PureComponent {
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

        <Dropdown>
          <DropdownTrigger>
            <div className="TitleBar__dropDown">
              &#xf180;
            </div>
          </DropdownTrigger>
          <DropdownContent>
            <ColorPicker
              color={this.props.boardBackgroundColor}
              colors={Object.values(Model.BOARD_COLORS)}
              onChangeComplete={this.onChangeBoardBackgroundColor}
            />
          </DropdownContent>
        </Dropdown>

        <HashForm
          formDocId={this.props.formDocId}
          activeDocId={this.props.activeDocId}
          requestedDocId={this.props.requestedDocId}
        />
      </div>
    )
  }
}

TitleBar.propTypes = {
  formDocId: PropTypes.string.isRequired,
  activeDocId: PropTypes.string.isRequired,
  requestedDocId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  boardBackgroundColor: PropTypes.string.isRequired
}

export default TitleBar
