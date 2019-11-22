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
import { ContactDoc, ContactDocInvites } from '.'

import ColorPicker from '../../ColorPicker'
import Label from '../../Label'
import { useDocument } from '../../../Hooks'
import Heading from '../../Heading'
import SecondaryText from '../../SecondaryText'

import { CurrentDeviceContext } from '../workspace/Device'
import { importFileList } from '../../../ImportData'
import ConnectionStatusBadge from './ConnectionStatusBadge'
import { useConnectionStatus } from '../../../PresenceHooks'
import Badge from '../../Badge'
import CenteredStack from '../../CenteredStack'
import { without } from '../../../Misc'
import ContactEditorDevice from './ContactEditorDevice'
import ListMenuSection from '../../ListMenuSection'
import ListMenuItem from '../../ListMenuItem'
import TitleEditor from '../../TitleEditor'
import ListItem from '../../ListItem'

import './ContactEditor.css'
import ListMenu from '../../ListMenu'
import MaxWidth from '../../MaxWidth'

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

  function setColor(color: { hex: string }) {
    changeDoc((d) => {
      d.color = color.hex
    })
  }

  const { avatarDocId, color, devices, invites } = doc

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

  return (
    <CenteredStack centerText={false}>
      <MaxWidth>
        <ListMenu>
          <div className="ContactEditor-heading">
            <Heading>Edit Profile...</Heading>
          </div>
          {renderNameEditor(props.hypermergeUrl)}
          {renderAvatarEditor(avatar, onFilesChanged, hiddenFileInput, onImportClick)}
          {renderPresenceColorSelector(color, setColor)}
          {renderDevices(devices, status, selfUrl, removeDevice, currentDeviceId)}
          {renderShares(invites)}
        </ListMenu>
      </MaxWidth>
    </CenteredStack>
  )
}

const renderNameEditor = (hypermergeUrl) => (
  <ListMenuSection title="Display Name">
    <ListMenuItem>
      <TitleEditor field="name" url={hypermergeUrl} />
    </ListMenuItem>
  </ListMenuSection>
)

const renderAvatarEditor = (avatar, onFilesChanged, hiddenFileInput, onImportClick) => (
  <ListMenuSection title="Avatar">
    <ListMenuItem>
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
    </ListMenuItem>
  </ListMenuSection>
)

const renderPresenceColorSelector = (color, setColor) => (
  <ListMenuSection title="Presence Color">
    <ListMenuItem>
      <ColorPicker color={color} colors={Object.values(USER_COLORS)} onChangeComplete={setColor} />
    </ListMenuItem>
    <ListMenuItem>
      <div className="ContactEditor-colorCopy">
        <SecondaryText>
          Your presence colour will be used to by other authors identify you when you are active on
          a board.
        </SecondaryText>
      </div>
    </ListMenuItem>
  </ListMenuSection>
)

const renderDevices = (devices, status, selfUrl, removeDevice, currentDeviceId) => {
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
    <div className="ListMenuSection">
      <div className="ListMenuSection-title">
        <CenteredStack direction="row">
          <ConnectionStatusBadge size="small" hover={false} contactId={selfUrl} />
          Devices
        </CenteredStack>
      </div>
      {renderedDevices}
      {status !== 'connected' ? (
        <ListMenuItem key="storage-peer-hint">
          <ListItem>
            <Badge backgroundColor="#00000000" size="medium" icon="cloud" />
            <SecondaryText>
              Consider adding{' '}
              <a href="https://github.com/mjtognetti/pushpin-peer">a storage peer</a> to keep your
              data online when PushPin is offline or closed.
            </SecondaryText>
          </ListItem>
        </ListMenuItem>
      ) : null}
    </div>
  )
}

const renderShares = (invites: ContactDocInvites) => {
  return (
    <ListMenuSection title="Shares">
      {invites ? (
        Object.entries(invites).map(([contact, shares]) => (
          <ListMenuItem key={contact}>
            <Content context="list" url={createDocumentLink('contact', contact as DocUrl)} />
            <SecondaryText>{shares.length} items shared</SecondaryText>
          </ListMenuItem>
        ))
      ) : (
        <ListMenuItem>
          <Heading>No shares...</Heading>
        </ListMenuItem>
      )}
    </ListMenuSection>
  )
}
