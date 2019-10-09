import React from 'react'
import { useOnlineDevicesForContact } from '../../../PresenceHooks'
import { useDocument } from '../../../Hooks'
import { ContactDoc } from '.'
import { HypermergeUrl } from '../../../ShareLink'
import './ConnectionStatusBadge.css'

export interface Props {
  contactId: HypermergeUrl
}

export type NoDevices = 'no-devices'
export type NotConnected = 'not-connected'
export type Connected = 'connected'
export type ConnectionStatus = NoDevices | NotConnected | Connected
export function useConnectionStatus(contactId: HypermergeUrl | null): ConnectionStatus {
  const [contact] = useDocument<ContactDoc>(contactId)
  const onlineDevices = useOnlineDevicesForContact(contactId)
  if (!contact || !contact.devices || contact.devices.length <= 1) return 'no-devices'
  return onlineDevices.length > 1 ? 'connected' : 'not-connected'
}

const STATUS_CLASS = {
  'no-devices': 'ConnectionStatus--noDevices',
  'not-connected': 'ConnectionStatus--notConnected',
  connected: 'ConnectionStatus--contected',
}

export default function ConnectionStatusBadge(props: Props) {
  const status = useConnectionStatus(props.contactId)
  return <div className={`ConnectionStatus ${STATUS_CLASS[status]}`} />
}
