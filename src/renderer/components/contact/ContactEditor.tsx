import React from 'react'
import { remote } from 'electron'
import Debug from 'debug'

import { Handle } from 'hypermerge'
import { createDocumentLink } from '../../ShareLink'
import * as Hyperfile from '../../hyperfile'

import { IMAGE_DIALOG_OPTIONS, DEFAULT_AVATAR_PATH } from '../../constants'
import Content, { ContentProps } from '../Content'
import { ContactDoc } from '.'

import ColorPicker from '../ColorPicker'

const { dialog } = remote
const log = Debug('pushpin:settings')

export const USER_COLORS = {
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
  GRAU: '#626262',
}

interface State {
  doc?: ContactDoc
}

export default class ContactEditor extends React.PureComponent<ContentProps, State> {
  private handle?: Handle<ContactDoc>
  state: State = {}

  // This is the New Boilerplate
  componentWillMount = () =>
    (this.handle = window.repo.watch(this.props.hypermergeUrl, (doc) => this.onChange(doc)))
  componentWillUnmount = () => this.handle && this.handle.close()

  onChange = (doc: ContactDoc) => {
    this.setState({ doc })
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
        this.handle &&
          this.handle.change((d) => {
            d.avatarDocId = hypermergeUrl
          })
      })
    })
  }

  setName = (e) => {
    this.handle &&
      this.handle.change((d) => {
        d.name = e.target.value
      })
  }

  setColor = (color) => {
    this.handle &&
      this.handle.change((d) => {
        d.color = color.hex
      })
  }

  render = () => {
    log('render')
    const { doc } = this.state
    if (!doc) {
      return null
    }

    const { avatarDocId, name, color } = doc

    let avatar
    if (avatarDocId) {
      avatar = <Content context="workspace" url={createDocumentLink('image', avatarDocId)} />
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
              <input type="text" onChange={this.setName} value={name || ''} />
            </div>
            <div className="ListMenu__label">Avatar</div>
            <div className="ListMenu__item ContactListItem">
              <div className="ListMenu__thumbnail">
                <div className="Avatar">{avatar}</div>
              </div>
              <div className="Label">
                <button className="Type--action" type="button" onClick={this.chooseAvatar}>
                  Choose from file...
                </button>
              </div>
            </div>
            <div className="ListMenu__label">Presence Color</div>
            <div className="ListMenu__item">
              <ColorPicker
                color={color}
                colors={Object.values(USER_COLORS)}
                onChangeComplete={this.setColor}
              />
            </div>
            <div className="ListMenu__label">
              <p className="Type--secondary">
                Your presence colour will be used to by other authors identify you when you are
                active on a board.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
