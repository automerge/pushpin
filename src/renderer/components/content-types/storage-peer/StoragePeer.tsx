import React from 'react'
import Debug from 'debug'

import { ContentProps } from '../../Content'
import Badge from '../../Badge'

import './StoragePeer.css'
import ListItem from '../../ListItem'
import ContentDragHandle from '../../ContentDragHandle'
import TitleWithSubtitle from '../../TitleWithSubtitle'
import { useStoragePeer } from './StoragePeerHooks'
import CenteredStack from '../../CenteredStack'
import SecondaryText from '../../SecondaryText'
import { useDeviceOnlineStatus } from '../../../PresenceHooks'
import Heading from '../../Heading'

const log = Debug('pushpin:settings')

export default function StoragePeer(props: ContentProps) {
  const [doc] = useStoragePeer(props.hypermergeUrl)
  const isOnline = useDeviceOnlineStatus(props.hypermergeUrl)

  if (!doc) {
    return null
  }

  const { context, url, hypermergeUrl } = props
  const { name, registry } = doc
  const countRegistered = Object.keys(registry || {}).length

  const title = name
  const subtitle = `${countRegistered} stored workspace${countRegistered === 1 ? '' : 's'}`

  switch (context) {
    case 'list':
      return (
        <ListItem>
          <ContentDragHandle url={url}>
            <Badge
              icon="cloud"
              shape="circle"
              color={isOnline ? 'white' : 'black'}
              backgroundColor={`var(${isOnline ? '--colorOnline' : '--colorOffline'})`}
            />
          </ContentDragHandle>
          <TitleWithSubtitle
            title={title}
            titleEditorField="name"
            subtitle={subtitle}
            hypermergeUrl={hypermergeUrl}
          />
        </ListItem>
      )

    case 'board':
      return (
        <div className="StoragePeer BoardCard--standard">
          <CenteredStack>
            <Badge
              icon="cloud"
              shape="circle"
              size="huge"
              color={isOnline ? 'white' : 'black'}
              backgroundColor={`var(${isOnline ? '--colorOnline' : '--colorOffline'})`}
            />
            <Heading wrap>{title}</Heading>
            <SecondaryText>{subtitle}</SecondaryText>
          </CenteredStack>
        </div>
      )

    default:
      log('storage peer render called in an unexpected context')
      return null
  }
}
