import React, { useState, useEffect } from 'react'
import Fs from 'fs'
import ContentTypes from '../../../ContentTypes'
import { PushpinUrl, HypermergeUrl } from '../../../ShareLink';
import { DEVICE_URL_PATH } from '../../../constants'
import { ContentProps } from '../../Content';
import { useDocument } from '../../../Hooks';

export interface DeviceDoc {
  name: string
}

function Device(props: ContentProps) {
  const [doc, changeDoc] = useDocument<DeviceDoc>(props.hypermergeUrl)
  if (!doc) return null
  return <div>{doc.name}</div>
}

function create(deviceAttrs, handle, callback) {
  handle.change((doc: DeviceDoc) => {
    doc.name = "Computer"
  })
  callback()
}

ContentTypes.register({
  type: 'device',
  name: 'Device',
  icon: 'desktop',
  contexts: {
    "title-bar": Device
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
    console.log('loading')
    const existingDeviceUrl = loadDeviceUrl()
    if (existingDeviceUrl) {
      setDeviceUrl(existingDeviceUrl)
      console.log("edu", existingDeviceUrl)
    } else {
      ContentTypes.create('device', {}, (newDeviceUrl: PushpinUrl) => {
        saveDeviceUrl(newDeviceUrl)

        console.log("ndu", newDeviceUrl)
        setDeviceUrl(newDeviceUrl)
      })
    }
  })

  return deviceUrl
}

export const CurrentDeviceContext = React.createContext<PushpinUrl | null>(null)
