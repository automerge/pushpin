import React from 'react'
import * as ContentTypes from '../../../ContentTypes'
import { ContentProps } from '../../Content'
import { useDocument } from '../../../Hooks'
import Badge from '../../ui/Badge'
import ContentDragHandle from '../../ui/ContentDragHandle'
import TitleWithSubtitle from '../../ui/TitleWithSubtitle'
import ListItem from '../../ui/ListItem'

interface Doc {
  title?: string
}

export default function DefaultInList(props: ContentProps) {
  const { url, hypermergeUrl } = props
  const [doc] = useDocument<Doc>(hypermergeUrl)

  if (!doc) {
    return null
  }

  const { type } = props
  const contentType = ContentTypes.lookup({ type, context: 'list' })

  const { icon = 'question', name = `Unidentified type: ${type}` } = contentType || {}

  // TODO: pick background color based on url
  return (
    <ListItem>
      <ContentDragHandle url={url}>
        <Badge icon={icon} />
      </ContentDragHandle>
      <TitleWithSubtitle title={doc.title || name} hypermergeUrl={hypermergeUrl} />
    </ListItem>
  )
}

ContentTypes.registerDefault({
  component: ListItem,
  context: 'list',
})
