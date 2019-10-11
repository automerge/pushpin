import React from 'react'
import Debug from 'debug'

import { ContentProps } from '../../Content'
import { StoragePeerDoc } from '.'
import Badge from '../../Badge'

import { createDocumentLink } from '../../../ShareLink'
import Label from '../../Label'

import './StoragePeer.css'
import { useDocument } from '../../../Hooks'
import TitleEditor from '../../TitleEditor'
import SecondaryText from '../../SecondaryText'

const log = Debug('pushpin:settings')

export default function StoragePeer(props: ContentProps) {
  const [doc] = useDocument<StoragePeerDoc>(props.hypermergeUrl)

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(
      'application/pushpin-url',
      createDocumentLink('storage-peer', props.hypermergeUrl)
    )
  }

  if (!doc) {
    return null
  }

  const { context } = props
  const { storedUrls } = doc

  switch (context) {
    case 'list':
      return (
        <div draggable onDragStart={onDragStart} className="DocLink">
          <Badge icon="cloud" shape="circle" />
          <Label>
            <TitleEditor field="name" url={props.hypermergeUrl} />
            <SecondaryText>
              {storedUrls.length} URL{Object.keys(storedUrls).length === 1 ? '' : 's'} stored
            </SecondaryText>
          </Label>
        </div>
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
