import React from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'
import Debug from 'debug'

import { IMAGE_DIALOG_OPTIONS } from '../model'

const { dialog } = remote
const log = Debug('pushpin:settings')

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
      alert(`Set avatar to ${ path }`)
    })
  }

  setName(e) {
    const name = e.target.value
    log(`Set name to ${ name }`)
  }

  render() {
    return (
      <div className="Settings">
        <p className="Settings__title">Your Profile</p>
        <h6>Display Name</h6>

        <input type="text" onChange={this.setName} defaultValue={this.props.name} />

        <h6>Avatar</h6>
        <div className="Avatar">
          <img src={this.props.avatar} />
        </div>
        <a className="Settings__setAvatar" onClick={this.chooseAvatar}>Choose from file...</a>
      </div>
    )
  }
}
