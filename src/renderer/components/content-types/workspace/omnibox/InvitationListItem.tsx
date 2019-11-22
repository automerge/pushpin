import React from 'react'
import Badge from '../../../Badge'
import ListItem from '../../../ListItem'
import { PushpinUrl, HypermergeUrl } from '../../../../ShareLink'
import ContentDragHandle from '../../../ContentDragHandle'
import TitleWithSubtitle from '../../../TitleWithSubtitle'

export interface Props {
  url: PushpinUrl
  hypermergeUrl: HypermergeUrl
  invitation: any
  selected?: boolean
}

export default function InvitationListItem(props: Props) {
  const { invitation, url, hypermergeUrl } = props

  const title = invitation.doc.title || 'Untitled'
  const subtitle = `From ${invitation.sender.name}`

  return (
    <ListItem>
      <ContentDragHandle url={url}>
        <Badge icon="envelope" backgroundColor={invitation.doc && invitation.doc.backgroundColor} />
      </ContentDragHandle>
      <TitleWithSubtitle title={title} subtitle={subtitle} hypermergeUrl={hypermergeUrl} />
    </ListItem>
  )
}
