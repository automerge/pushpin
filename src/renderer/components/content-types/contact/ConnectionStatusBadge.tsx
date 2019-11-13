import React from 'react'
import { HypermergeUrl } from '../../../ShareLink'
import Badge, { BadgeSize } from '../../Badge'
import { useConnectionStatus } from '../../../PresenceHooks'
import './ConnectionStatusBadge.css'

export interface Props {
  contactId: HypermergeUrl
  size?: BadgeSize
}

const STATUS = {
  'no-devices': {
    backgroundColor: 'var(--colorOffline)',
    color: 'black',
    icon: 'wifi',
    hover: 'No other devices to sync with.',
  },
  'not-connected': {
    backgroundColor: 'var(--colorWarning)',
    color: 'black',
    icon: 'wifi',
    hover: 'Cannot reach your other devices.',
  },
  connected: {
    backgroundColor: 'var(--colorOnline)',
    color: 'white',
    icon: 'wifi',
    hover: 'Syncing active.',
  },
}

export default function ConnectionStatusBadge(props: Props) {
  const status = useConnectionStatus(props.contactId)
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
