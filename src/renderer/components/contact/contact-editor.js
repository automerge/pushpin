import React from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'
import Debug from 'debug'

import { createDocumentLink } from '../../share-link'
import * as Hyperfile from '../../hyperfile'

import { USER, IMAGE_DIALOG_OPTIONS, DEFAULT_AVATAR_PATH } from '../../constants'
import Content from '../content'
import ColorPicker from '../color-picker'

const { dialog } = remote
const log = Debug('pushpin:settings')

const USER_COLORS = {
  // RUST: '#D96767',
  // ENGINEER: '#FFE283',
  // KEYLIME: '#A1E991',
  // PINE: '#63D2A5',
  // SOFT: '#64BCDF',
  // BIGBLUE: '#3A66A3',
  // ROYAL: '#A485E2',
  // KAWAII: '#ED77AB',
  // BLACK: '#2b2b2b',
  RED: '#F87060',
  VORANGE: '#FFC919',
  DARKGRE: '#6CCB44',
  PINETO: '#00CA7B',
  VBLAU: '#3395E8',
  CHILBLAU: '#004098',
  OPTIROYA: '#4700D8',
  MAGEGENTA: '#E80FA7',
  GRAU: '#626262'
}

export default class ContactEditor extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired
  }

  static initializeDocument = (doc, typeAttrs) => {
    doc.name = USER
    const USER_COLOR_VALUES = Object.values(USER_COLORS)
    const color = USER_COLOR_VALUES[Math.floor(Math.random() * USER_COLOR_VALUES.length)]
    doc.color = color
  }

  state = {}

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.hypermergeUrl)
  componentWillUnmount = () => this.handle.close()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }
  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
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

      Hyperfile.write(paths[0], (err, hyperfileUrl) => {
        if (err) {
          log(err)
          return
        }

        const hypermergeUrl = Content.initializeContentDoc('image', { hyperfileUrl })
        this.handle.change((d) => {
          d.avatarDocId = hypermergeUrl
        })
      })
    })
  }

  setName = (e) => {
    this.handle.change((d) => {
      d.name = e.target.value
    })
  }

  setColor = (color) => {
    this.handle.change((d) => {
      d.color = color.hex
    })
  }

  render = () => {
    log('render')
    let avatar
    if (this.state.avatarDocId) {
      avatar = <Content context="workspace" url={createDocumentLink('image', this.state.avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src={DEFAULT_AVATAR_PATH} />
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
              <input type="text" onChange={this.setName} value={this.state.name || ''} />
            </div>
            <div className="ListMenu__label">Avatar</div>
            <div className="ListMenu__item ContactListItem">
              <div className="ListMenu__thumbnail">
                <div className="Avatar">
                  {avatar}
                </div>
              </div>
              <div className="Label">
                <button className="Type--action" type="button" onClick={this.chooseAvatar}>Choose from file...</button>
              </div>
            </div>
            <div className="ListMenu__label">Presence Color</div>
            <div className="ListMenu__item">
              <ColorPicker
                color={this.state.color}
                colors={Object.values(USER_COLORS)}
                onChangeComplete={this.setColor}
              />
            </div>
            <div className="ListMenu__label">
              <p className="Type--secondary">Your presence colour will be used to by other authors identify you when you are active on a board.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
