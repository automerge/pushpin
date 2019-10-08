import React, { useState, useEffect } from 'react'
import Fs from 'fs'
import Os from 'os'
import ContentTypes from '../../../ContentTypes'
import { PushpinUrl } from '../../../ShareLink'
import { DEVICE_URL_PATH } from '../../../constants'
import { ContentProps } from '../../Content'
import { useDocument } from '../../../Hooks'
import Badge from '../../Badge'
import './Device.css'
import TitleEditor from '../../TitleEditor'
import { useOnlineStatusForDevice } from '../../../PresenceHooks'

export interface DeviceDoc {
  icon: string // fa-icon name
  name: string
}

const ONLINE_COLOR = '#33AB77'
const OFFLINE_COLOR = 'lightgray'

interface Props extends ContentProps {
  editable: boolean
}

function Device(props: Props) {
  const [doc] = useDocument<DeviceDoc>(props.hypermergeUrl)
  const isOnline = useOnlineStatusForDevice(props.hypermergeUrl)
  if (!doc) return null
  const { icon = 'desktop', name } = doc

  switch (props.context) {
    case 'title-bar':
      return (
        <div className={isOnline ? 'Device Device--online' : 'Device'}>
          <Badge
            icon={doc.icon || 'desktop'}
            shape="square"
            size="large"
            backgroundColor={isOnline ? ONLINE_COLOR : OFFLINE_COLOR}
          />
        </div>
      )
    case 'contact':
      return (
        <div className={isOnline ? 'Device Device--online' : 'Device'}>
          <Badge
            icon={doc.icon || 'desktop'}
            shape="circle"
            size="small"
            backgroundColor={isOnline ? ONLINE_COLOR : OFFLINE_COLOR}
          />
        </div>
      )
    default:
      return (
        <div className={isOnline ? 'DeviceListItem DeviceListItem--online' : 'DeviceListItem'}>
          <Badge
            icon={icon}
            shape="circle"
            backgroundColor={isOnline ? ONLINE_COLOR : OFFLINE_COLOR}
          />
          {props.editable ? (
            <TitleEditor field="name" url={props.hypermergeUrl} />
          ) : (
            <div className="DocLink__title">{name}</div>
          )}
        </div>
      )
  }
}

function create(deviceAttrs, handle, callback) {
  ;(navigator as any).getBattery().then((b) => {
    const isLaptop = b.chargingTime !== 0
    const icon = isLaptop ? 'laptop' : 'desktop'
    handle.change((doc: DeviceDoc) => {
      doc.name = Os.hostname()
      doc.icon = icon
    })
  })
  callback()
}

ContentTypes.register({
  type: 'device',
  name: 'Device',
  icon: 'desktop',
  contexts: {
    list: Device,
    'title-bar': Device,
    contact: Device,
    board: Device,
  },
  resizable: false,
  unlisted: true,
  create,
})

function loadDeviceUrl(): PushpinUrl | null {
  if (Fs.existsSync(DEVICE_URL_PATH)) {
    const json = JSON.parse(Fs.readFileSync(DEVICE_URL_PATH, { encoding: 'utf-8' }))
    if (json.deviceUrl) {
      return json.deviceUrl
    }
  }
  return null
}

function saveDeviceUrl(deviceUrl: PushpinUrl): void {
  const deviceUrlData = { deviceUrl }
  Fs.writeFileSync(DEVICE_URL_PATH, JSON.stringify(deviceUrlData))
}

// I might not want to export setDeviceUrl...
export function useCurrentDeviceUrl(): PushpinUrl | null {
  const [deviceUrl, setDeviceUrl] = useState<PushpinUrl | null>(null)

  useEffect(() => {
    const existingDeviceUrl = loadDeviceUrl()
    if (existingDeviceUrl) {
      setDeviceUrl(existingDeviceUrl)
    } else {
      ContentTypes.create('device', {}, (newDeviceUrl: PushpinUrl) => {
        saveDeviceUrl(newDeviceUrl)
        setDeviceUrl(newDeviceUrl)
      })
    }
  })

  return deviceUrl
}

export const CurrentDeviceContext = React.createContext<PushpinUrl | null>(null)
