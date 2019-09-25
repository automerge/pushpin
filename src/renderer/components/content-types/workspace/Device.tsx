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
import SyncState from '../../SyncState';

export interface DeviceDoc {
  name: string
}

function Device(props: ContentProps) {
  const { hypermergeUrl, context } = props
  const [doc] = useDocument<DeviceDoc>(hypermergeUrl)
  if (!doc) return null

  switch (context) {
    case 'board':
      return (
        <div className="Device">
          <Badge icon="desktop" shape="square" />
          <div className="Device-capsule">
            {doc.name}
          </div>

          <SyncState ahead={300} behind={22} />
        </div>
      )
    default:
      return <div>{doc.name}</div>
  }
}

function create(deviceAttrs, handle, callback) {
  handle.change((doc: DeviceDoc) => {
    doc.name = Os.hostname()
  })
  callback()
}

ContentTypes.register({
  type: 'device',
  name: 'Device',
  icon: 'desktop',
  contexts: {
    'title-bar': Device,
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
