import React from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'

import Loop from '../loop'

// we should make the avatar image a proper ImageCard
import { IMAGE_DIALOG_OPTIONS } from '../constants'
import * as Identity from '../models/identity'

const { dialog } = remote
// import Debug from 'debug'
// const log = Debug('pushpin:settings')

export default class Settings extends React.PureComponent {
  static propTypes = {
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }

  static defaultProps = {
    avatar: '../img/default-avatar.png'
  }

  constructor() {
    super()
    this.chooseAvatar = this.chooseAvatar.bind(this)
    this.setName = this.setName.bind(this)
  }

  chooseAvatar() {
    dialog.showOpenDialog(IMAGE_DIALOG_OPTIONS, (paths) => {
      // User aborted.
      if (!paths) {
        return
      }
      if (paths.length !== 1) {
        throw new Error('Expected exactly one path?')
      }
      const path = paths[0]
      // this should create a hyperfile and set the avatar to that, i suppose
      Loop.dispatch(Identity.updateSelfAvatar, { avatar: path })
    })
  }

  setName(e) {
    const name = e.target.value
    Loop.dispatch(Identity.updateSelfName, { name })
  }

  render() {
    return (
      <div className="Settings">
        <div className="Settings__section">
          <p className="Settings__title">Your Profile</p>
        </div>
        <div className="Settings__section">
          <h6>Avatar</h6>
          <div className="Settings__avatarGroup">
            <div className="Avatar">
              <img src={this.props.avatar} />
            </div>
            <a className="Settings__setAvatar" onClick={this.chooseAvatar}>Choose from file...</a>
          </div>
        </div>
        <div className="Settings__section">
          <h6>Display Name</h6>
          <input type="text" onChange={this.setName} defaultValue={this.props.name} />
        </div>
      </div>
    )
  }
}
