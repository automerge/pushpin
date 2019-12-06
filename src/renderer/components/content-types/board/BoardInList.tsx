import React from 'react'
import { BoardDoc, icon } from '.'
import { ContentProps } from '../../Content'
import { useDocument } from '../../../Hooks'
import Badge, { Props as BadgeProps } from '../../ui/Badge'
import ListItem from '../../ui/ListItem'
import TitleWithSubtitle from '../../ui/TitleWithSubtitle'
import ContentDragHandle from '../../ui/ContentDragHandle'

interface Props extends ContentProps {
  editable: boolean
}

export default function BoardInList(props: Props) {
  const { hypermergeUrl, url, editable } = props
  const [doc] = useDocument<BoardDoc>(hypermergeUrl)

  if (!doc) {
    return null
  }

  const { title, backgroundColor, cards } = doc

  const cardLength = Object.keys(cards).length
  const subtitle = `${cardLength} item${cardLength !== 1 ? 's' : ''}`

  const badgeProps: BadgeProps = {
    icon,
    backgroundColor,
  }

  return (
    <ListItem>
      <ContentDragHandle url={url}>
        <Badge {...badgeProps} />
      </ContentDragHandle>
      <TitleWithSubtitle
        title={title}
        subtitle={subtitle}
        hypermergeUrl={hypermergeUrl}
        editable={editable}
      />
    </ListItem>
  )
}
