import React from 'react'
import Debug from 'debug'

import { ContentProps } from '../../Content'
import { StoragePeerDoc } from '.'
import Badge from '../../Badge'

import { createDocumentLink } from '../../../ShareLink'
import Text from '../../Text'
import Label from '../../Label'

import './StoragePeer.css'
import { useDocument } from '../../../Hooks'

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
  const { name } = doc

  switch (context) {
    case 'list':
      return (
        <div draggable onDragStart={onDragStart} className="DocLink">
          <Badge icon="cloud" shape="circle" />
          <Label>
            <Text>{name}</Text>
          </Label>
        </div>
      )

    case 'board':
      return (
        <div className="StoragePeer--board">
          <Badge icon="cloud" size="large" />
          <div className="StoragePeer-boardLabel">{name}</div>
        </div>
      )

    default:
      log('storage peer render called in an unexpected context')
      return null
  }
}
