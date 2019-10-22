import React from 'react'
import { useOnlineDevicesForContact } from '../../../PresenceHooks'
import { useDocument } from '../../../Hooks'
import { ContactDoc } from '.'
import { HypermergeUrl } from '../../../ShareLink'
import Badge, { BadgeSize } from '../../Badge'

export interface Props {
  contactId: HypermergeUrl
  size?: BadgeSize
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

const STATUS = {
  'no-devices': {
    color: 'grey',
    icon: ['cloud', 'warning'] as [string, string],
    hover: 'Nothing to sync with.',
  },
  'not-connected': {
    color: 'orange',
    icon: ['cloud', 'times'] as [string, string],
    hover: 'Your other devices are unreachable.',
  },
  connected: {
    color: 'green',
    icon: 'undefined',
    hover: 'Syncing active.',
  },
}

export default function OwnDeviceConnectionStatus(props: Props) {
  const status = useConnectionStatus(props.contactId)
  return (
    // xxx: fix this style
    <div className="TitleBar-Map-ColorBadgePlacer">
      <Badge
        backgroundColor={STATUS[status].color}
        size={props.size || 'tiny'}
        icon={STATUS[status].icon}
        hover={STATUS[status].hover}
      />
    </div>
  )
}
