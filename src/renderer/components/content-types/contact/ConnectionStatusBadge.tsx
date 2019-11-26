import React from 'react'
import { HypermergeUrl } from '../../../ShareLink'
import Badge, { BadgeSize } from '../../ui/Badge'
import { useConnectionStatus } from '../../../PresenceHooks'
import './ConnectionStatusBadge.css'

export interface Props {
  contactId: HypermergeUrl
  size?: BadgeSize
  hover?: boolean
}

const STATUS = {
  'not-connected': {
    /* nothing, we return null */
  },
  'self-no-devices': {
    backgroundColor: 'var(--colorOffline)',
    color: 'black',
    icon: 'wifi',
    hover: 'No other devices to sync with.',
  },
  'self-unreachable': {
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

export default function ConnectionStatusBadge({ contactId, size = 'tiny', hover = true }: Props) {
  const status = useConnectionStatus(contactId)
  if (status === 'not-connected') {
    return null
  }
  return (
    <div className="OwnDevice-ConnectionStatus">
      <Badge
        shape="square"
        color={STATUS[status].color}
        backgroundColor={STATUS[status].backgroundColor}
        size={size}
        icon={STATUS[status].icon}
        hover={hover ? STATUS[status].hover : undefined}
      />
    </div>
  )
}
