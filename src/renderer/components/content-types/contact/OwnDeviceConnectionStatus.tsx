import React from 'react'
import { HypermergeUrl } from '../../../ShareLink'
import Badge, { BadgeSize } from '../../Badge'
import { useConnectionStatus } from '../../../PresenceHooks'
import './OwnDeviceConnectionStatus.css'

export interface Props {
  contactId: HypermergeUrl
  size?: BadgeSize
}

const STATUS = {
  'no-devices': {
    color: 'black',
    icon: 'wifi',
    hover: 'No other devices to sync with.',
  },
  'not-connected': {
    backgroundColor: 'orange',
    icon: 'wifi',
    hover: 'Cannot reach your other devices.',
  },
  connected: {
    backgroundColor: 'darkseagreen',
    color: 'black',
    icon: 'wifi',
    hover: 'Syncing active.',
  },
}

export default function OwnDeviceConnectionStatus(props: Props) {
  const status = 'not-connected' // useConnectionStatus(props.contactId)
  return (
    // xxx: fix this style
    <div className="OwnDevice-ConnectionStatus">
      <Badge
        shape="square"
        color={STATUS[status].color}
        backgroundColor={STATUS[status].backgroundColor}
        size={props.size || 'tiny'}
        icon={STATUS[status].icon}
        hover={STATUS[status].hover}
      />
    </div>
  )
}
