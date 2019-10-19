import React from 'react'
import { useOnlineDevicesForContact } from '../../../PresenceHooks'
import { useDocument } from '../../../Hooks'
import { ContactDoc } from '.'
import { HypermergeUrl } from '../../../ShareLink'
import ColorBadge from '../../ColorBadge'

export interface Props {
  contactId: HypermergeUrl
}

type NoDevices = 'no-devices' // No other devices are available to connect to.
type NotConnected = 'not-connected' // There are other devices to connect to, but not connected to any of them.
type Connected = 'connected' // There are other devices to connect to, and connected to at least one.
type ConnectionStatus = NoDevices | NotConnected | Connected
function useConnectionStatus(contactId: HypermergeUrl | null): ConnectionStatus {
  const [contact] = useDocument<ContactDoc>(contactId)
  const onlineDevices = useOnlineDevicesForContact(contactId)
  if (!contact || !contact.devices || contact.devices.length <= 1) return 'no-devices'
  return onlineDevices.length > 1 ? 'connected' : 'not-connected'
}

const STATUS_CLASS = {
  'no-devices': 'grey',
  'not-connected': 'orange',
  connected: 'green',
}

export default function OwnDeviceConnectionStatus(props: Props) {
  const status = useConnectionStatus(props.contactId)
  return <ColorBadge color={STATUS_CLASS[status]} />
}
