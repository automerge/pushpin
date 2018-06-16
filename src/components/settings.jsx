import React from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'
import Debug from 'debug'

import { createDocumentLink } from '../share-link'
import * as Hyperfile from '../hyperfile'

import { IMAGE_DIALOG_OPTIONS } from '../constants'
import Content from './content'

const { dialog } = remote
const log = Debug('pushpin:settings')

export default class Settings extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  state = {}

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => window.hm.releaseHandle(this.handle)
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }
  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  chooseAvatar = () => {
    dialog.showOpenDialog(IMAGE_DIALOG_OPTIONS, (paths) => {
      // User aborted.
      if (!paths) {
        return
      }
      if (paths.length !== 1) {
        throw new Error('Expected exactly one path?')
      }

      Hyperfile.write(paths[0], (err, hyperfileId) => {
        if (err) {
          log(err)
          return
        }

        const docId = Content.initializeContentDoc('image', { hyperfileId })
        this.handle.change((d) => {
          d.avatarDocId = docId
        })
      })
    })
  }

  setName = (e) => {
    this.handle.change((d) => {
      d.name = e.target.value
    })
  }

  render = () => {
    log('render')
    let avatar
    if (this.state.avatarDocId) {
      avatar = <Content url={createDocumentLink('image', this.state.avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src="../img/default-avatar.png" />
    }

    return (
      <div className="PopOverWrapper">
        <div className="ListMenu">
          <div className="ListMenu__header">
            <p className="Type--header">Your Profile</p>
          </div>
          <div className="ListMenu__section">
            <div className="ListMenu__label">Display Name</div>
            <div className="ListMenu__item">
              <input type="text" onChange={this.setName} defaultValue={this.state.name} />
            </div>
            <div className="ListMenu__label">Avatar</div>
            <div className="ListMenu__item">
              <div className="ListMenu__thumbnail">
                <div className="Avatar">
                  { avatar }
                </div>
              </div>
              <div className="Label">
                <button className="Type--action" onClick={this.chooseAvatar}>Choose from file...</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

