import React, { useContext, useRef } from 'react'
import { DocUrl } from 'hypermerge'

import Automerge from 'automerge'
import { createDocumentLink, PushpinUrl, parseDocumentLink } from '../../../ShareLink'

import { DEFAULT_AVATAR_PATH } from '../../../constants'
import Content, { ContentProps } from '../../Content'
import { ContactDoc } from '.'

import ColorPicker from '../../ColorPicker'
import Label from '../../Label'
import { useDocument } from '../../../Hooks'
import Heading from '../../Heading'
import SecondaryText from '../../SecondaryText'

import ListItem from '../../ListMenuItem'
import ActionListItem from '../workspace/omnibox/ActionListItem'

import './ContactEditor.css'
import { CurrentDeviceContext } from '../workspace/Device'
import { importFileList } from '../../../ImportData'
import OwnDeviceConnectionStatus from './OwnDeviceConnectionStatus'
import { useConnectionStatus } from '../../../PresenceHooks'
import Badge from '../../Badge'

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
  const currentDeviceId = useContext(CurrentDeviceContext)
  const hiddenFileInput = useRef<HTMLInputElement>(null)
  const status = useConnectionStatus(props.hypermergeUrl)

  const { hypermergeUrl } = props

  if (!doc) {
    return null
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

  const { avatarDocId, name, color, devices } = doc

  let avatar
  if (avatarDocId) {
    avatar = <Content context="workspace" url={createDocumentLink('image', avatarDocId)} />
  } else {
    avatar = <img alt="avatar" src={DEFAULT_AVATAR_PATH} />
  }

  const onImportClick = (e) => {
    if (hiddenFileInput.current) {
      hiddenFileInput.current.click()
    }
  }
  // xxx: only allow images & only one
  const onFilesChanged = (e) => {
    importFileList(e.target.files, (url, i) =>
      changeDoc((doc) => {
        const { hypermergeUrl } = parseDocumentLink(url)
        doc.avatarDocId = hypermergeUrl
      })
    )
  }

  function removeDevice(url: PushpinUrl) {
    const { hypermergeUrl } = parseDocumentLink(url)
    changeDoc((d) => {
      const devices = d.devices as Automerge.List<DocUrl>
      if (!devices) {
        return
      }
      const dPos = devices.findIndex((u) => u === hypermergeUrl)
      if (!dPos) {
        return
      }
      // the automerge type for deleteAt is wrong
      devices.deleteAt!(dPos)
    })
  }

  const deviceActions = [
    {
      name: 'remove',
      destructive: true,
      callback: (url: PushpinUrl) => () => removeDevice(url),
      faIcon: 'fa-trash',
      label: 'Remove',
      shortcut: '⌘+⌫',
      keysForActionPressed: (e) => (e.metaKey || e.ctrlKey) && e.key === 'Backspace',
    },
  ]

  const renderDevices = () => {
    if (!devices) {
      return <SecondaryText>Something is wrong, you should always have a device!</SecondaryText>
    }
    const renderedDevices = devices
      .map((d) => createDocumentLink('device', d))
      .map((d) => (
        <ActionListItem
          key={d}
          contentUrl={d}
          actions={d === currentDeviceId ? [] : deviceActions}
          selected={false}
        >
          <Content context="list" url={d} editable />
        </ActionListItem>
      ))

    return (
      <div className="ContactEditor-section">
        <div className="ContactEditor-sectionLabel">
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <OwnDeviceConnectionStatus size="medium" contactId={hypermergeUrl} />
            Devices
          </div>
        </div>
        <div className="ContactEditor-sectionContent">{renderedDevices}</div>
        {status !== 'connected' ? (
          <div className="ContactEditor-sectionLabel">
            <ListItem>
              <Badge backgroundColor="#00000000" size="medium" icon="cloud" />
              <SecondaryText>
                You should <a href="https://github.com/mjtognetti/pushpin-peer">add a cloud peer</a>
                !
              </SecondaryText>
            </ListItem>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="ContactEditor">
      <div className="ContactEditor-content">
        <div className="ContactEditor-heading">
          <Heading>Edit Profile...</Heading>
        </div>
        <div className="ContactEditor-section">
          <div className="ContactEditor-sectionLabel">Display Name</div>
          <div className="ContactEditor-sectionContent">
            <input
              className="ContactEditor-input"
              type="text"
              onChange={setName}
              value={name || ''}
            />
          </div>
        </div>
        <div className="ContactEditor-section">
          <div className="ContactEditor-sectionLabel">Avatar</div>
          <div className="ContactEditor-sectionContent">
            <div className="ContactEditor-row">
              <div className="ContactEditor-avatar">
                <div className="Avatar">{avatar}</div>
              </div>
              <Label>
                <input
                  type="file"
                  id="hiddenImporter"
                  accept="image/*"
                  onChange={onFilesChanged}
                  ref={hiddenFileInput}
                  style={{ display: 'none' }}
                />
                <button type="button" onClick={onImportClick}>
                  Choose from file...
                </button>
              </Label>
            </div>
          </div>
        </div>
        <div className="ContactEditor-section">
          <div className="ContactEditor-sectionLabel">Presence Color</div>
          <div className="ContactEditor-sectionContent">
            <ColorPicker
              color={color}
              colors={Object.values(USER_COLORS)}
              onChangeComplete={setColor}
            />
            <div className="ContactEditor-colorCopy">
              <SecondaryText>
                Your presence colour will be used to by other authors identify you when you are
                active on a board.
              </SecondaryText>
            </div>
          </div>
        </div>
        {renderDevices()}
      </div>
    </div>
  )
}
