import React from 'react'
import { HypermergeUrl } from '../../../ShareLink'
import Badge, { BadgeSize } from '../../Badge'
import { useConnectionStatus } from '../../../PresenceHooks'

export interface Props {
  contactId: HypermergeUrl
  size?: BadgeSize
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
