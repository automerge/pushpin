import React from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'
import Debug from 'debug'

import Loop from '../loop'
import ContentTypes from '../content-types'

// we should make the avatar image a proper ImageCard
import { IMAGE_DIALOG_OPTIONS } from '../constants'
import * as Identity from '../models/identity'
import Content from './content'

const { dialog } = remote
const log = Debug('pushpin:settings')

export default class Settings extends React.PureComponent {
  constructor() {
    super()
    this.chooseAvatar = this.chooseAvatar.bind(this)
    this.setName = this.setName.bind(this)
  }

  chooseAvatar() {
    // TODO: Images only update on refresh sometimes
    dialog.showOpenDialog(IMAGE_DIALOG_OPTIONS, (paths) => {
      // User aborted.
      if (!paths) {
        return
      }
      if (paths.length !== 1) {
        throw new Error('Expected exactly one path?')
      }
      const path = paths[0]
      const docId = Content.initializeContentDoc('image', { path })
      this.props.onChange(d => d.avatarDocId = docId)
    })
  }

  setName(e) {
    this.props.onChange(d => d.name = e.target.value)
  }

  render() {
    let avatar
    if (this.props.doc.avatarDocId) {
      avatar = <Content card={{ type: 'image', docId: this.props.doc.avatarDocId }} />
    } else {
      avatar = <img src="../img/default-avatar.png" />
    }

    return (
      <div className="Settings">
        <div className="Settings__section">
          <p className="Settings__title">Your Profile</p>
        </div>
        <div className="Settings__section">
          <h6>Avatar</h6>
          <div className="Settings__avatarGroup">
            <div className="Avatar">
              { avatar }
            </div>
            <a className="Settings__setAvatar" onClick={this.chooseAvatar}>Choose from file...</a>
          </div>
        </div>
        <div className="Settings__section">
          <h6>Display Name</h6>
          <input type="text" onChange={this.setName} defaultValue={this.props.doc.name} />
        </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: Settings,
  type: 'settings',
  name: 'Settings',
  icon: 'sticky-note',
  unlisted: true,
})
