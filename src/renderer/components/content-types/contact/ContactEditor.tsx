import React, { useContext, useRef } from 'react'
import { DocUrl } from 'hypermerge'

import Automerge from 'automerge'
import {
  createDocumentLink,
  PushpinUrl,
  parseDocumentLink,
  HypermergeUrl,
} from '../../../ShareLink'

import { DEFAULT_AVATAR_PATH } from '../../../constants'
import Content, { ContentProps } from '../../Content'
import { ContactDoc } from '.'

import ColorPicker from '../../ColorPicker'
import Label from '../../Label'
import { useDocument } from '../../../Hooks'
import Heading from '../../Heading'
import SecondaryText from '../../SecondaryText'

import ListItem from '../../ListMenuItem'

import './ContactEditor.css'
import { CurrentDeviceContext } from '../workspace/Device'
import { importFileList } from '../../../ImportData'
import ConnectionStatusBadge from './ConnectionStatusBadge'
import { useConnectionStatus } from '../../../PresenceHooks'
import Badge from '../../Badge'
import CenteredStack from '../../CenteredStack'
import { without } from '../../../Misc'
import ContactEditorDevice from './ContactEditorDevice'

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

  const { hypermergeUrl: selfUrl } = props

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

  const onImportClick = () => {
    if (hiddenFileInput.current) {
      hiddenFileInput.current.click()
    }
  }
  // xxx: only allow images & only one
  const onFilesChanged = (e) => {
    importFileList(e.target.files, (url) =>
      changeDoc((doc) => {
        const { hypermergeUrl } = parseDocumentLink(url)
        doc.avatarDocId = hypermergeUrl
      })
    )
  }

  function removeDevice(url: PushpinUrl) {
    const { hypermergeUrl: deviceUrl } = parseDocumentLink(url)
    changeDoc((d) => {
      const devices = d.devices as Automerge.List<DocUrl>
      if (!devices) {
        return
      }
      without(deviceUrl, devices)
    })
  }

  const renderDevices = () => {
    if (!devices) {
      return <SecondaryText>Something is wrong, you should always have a device!</SecondaryText>
    }
    const renderedDevices = devices
      .map((deviceUrl: HypermergeUrl) => createDocumentLink('device', deviceUrl))
      .map((deviceId: PushpinUrl) => (
        <ContactEditorDevice
          key={deviceId}
          selfUrl={selfUrl}
          deviceId={deviceId}
          onRemoveDevice={removeDevice}
          isCurrentDevice={deviceId === currentDeviceId}
        />
      ))

    return (
      <div className="ContactEditor-section">
        <div className="ContactEditor-sectionLabel">
          <CenteredStack direction="row">
            <ConnectionStatusBadge size="small" hover={false} contactId={selfUrl} />
            Devices
          </CenteredStack>
        </div>
        <div className="ContactEditor-sectionContent">{renderedDevices}</div>
        {status !== 'connected' ? (
          <div className="ContactEditor-sectionLabel">
            <ListItem>
              <Badge backgroundColor="#00000000" size="medium" icon="cloud" />
              <SecondaryText>
                Consider adding{' '}
                <a href="https://github.com/mjtognetti/pushpin-peer">a storage peer</a> to keep your
                data online when PushPin is offline or closed.
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
