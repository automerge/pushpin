import React from 'react'
import Debug from 'debug'

import { ContentProps } from '../../Content'
import { StoragePeerDoc } from '.'
import Badge from '../../Badge'

import './StoragePeer.css'
import { useDocument } from '../../../Hooks'
import TitleEditor from '../../TitleEditor'
import ListItem from '../../ListItem'
import ContentDragHandle from '../../ContentDragHandle'
import TitleWithSubtitle from '../../TitleWithSubtitle'

const log = Debug('pushpin:settings')

export default function StoragePeer(props: ContentProps) {
  const [doc] = useDocument<StoragePeerDoc>(props.hypermergeUrl)

  if (!doc) {
    return null
  }

  const { context, url, hypermergeUrl } = props
  const { name, storedUrls } = doc

  const title = name
  const subtitle = `${storedUrls.length} URL${
    Object.keys(storedUrls).length === 1 ? '' : 's'
  } stored`

  switch (context) {
    case 'list':
      return (
        <ListItem>
          <ContentDragHandle url={url}>
            <Badge icon="cloud" shape="circle" />
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
        <div className="StoragePeer">
          <Badge icon="cloud" size="large" />
          <TitleEditor field="name" url={props.hypermergeUrl} />
        </div>
      )

    default:
      log('storage peer render called in an unexpected context')
      return null
  }
}
