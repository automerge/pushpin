import React from 'react'
import { remote } from 'electron'
import Debug from 'debug'

import { createDocumentLink } from '../../ShareLink'
import * as Hyperfile from '../../hyperfile'

import { IMAGE_DIALOG_OPTIONS, DEFAULT_AVATAR_PATH } from '../../constants'
import Content, { ContentProps } from '../Content'
import { ContactDoc } from '.'

import ColorPicker from '../ColorPicker'
import Label from '../Label'
import { useDocument } from '../../Hooks'
import Popover from '../Popover'
import Heading from '../Heading'
import SecondaryText from '../SecondaryText'

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

export default function ContactEditor(props: ContentProps) {
  const [doc, changeDoc] = useDocument<ContactDoc>(props.hypermergeUrl)

  if (!doc) {
    return null
  }

  function chooseAvatar() {
    dialog.showOpenDialog(IMAGE_DIALOG_OPTIONS, (paths) => {
      // User aborted.
      if (!paths) {
        return
      }
      if (paths.length !== 1) {
        throw new Error('Expected exactly one path?')
      }

      Hyperfile.write(paths[0])
        .then((hyperfileUrl) => {
          const hypermergeUrl = Content.initializeContentDoc('image', { hyperfileUrl })
          changeDoc((d) => {
            d.avatarDocId = hypermergeUrl
          })
        })
        .catch((err) => {
          log(err)
        })
    })
  }

  function setName(e: React.ChangeEvent<HTMLInputElement>) {
    changeDoc((d) => {
      d.name = e.target.value
    })
  }

  function setColor(color: { hex: string }) {
    changeDoc((d) => {
      d.color = color.hex
    })
  }

  const { avatarDocId, name, color } = doc

  let avatar
  if (avatarDocId) {
    avatar = <Content context="workspace" url={createDocumentLink('image', avatarDocId)} />
  } else {
    avatar = <img alt="avatar" src={DEFAULT_AVATAR_PATH} />
  }

  return (
    <Popover>
      <div className="ListMenu">
        <div className="ListMenu__header">
          <Heading>Your Profile</Heading>
        </div>
        <div className="ListMenu__section">
          <div className="ListMenu__label">Display Name</div>
          <div className="ListMenu__item">
            <input type="text" onChange={setName} value={name || ''} />
          </div>
          <div className="ListMenu__label">Avatar</div>
          <div className="ListMenu__item ContactListItem">
            <div className="ListMenu__thumbnail">
              <div className="Avatar">{avatar}</div>
            </div>
            <Label>
              <button type="button" onClick={chooseAvatar}>
                Choose from file...
              </button>
            </Label>
          </div>
          <div className="ListMenu__label">Presence Color</div>
          <div className="ListMenu__item">
            <ColorPicker
              color={color}
              colors={Object.values(USER_COLORS)}
              onChangeComplete={setColor}
            />
          </div>
          <div className="ListMenu__label">
            <SecondaryText>
              Your presence colour will be used to by other authors identify you when you are active
              on a board.
            </SecondaryText>
          </div>
        </div>
      </div>
    </Popover>
  )
}
