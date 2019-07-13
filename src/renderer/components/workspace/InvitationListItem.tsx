import React from 'react'
import ListMenuItem from '../ListMenuItem'
import Badge from '../Badge'
import Text from '../Text'
import SecondaryText from '../SecondaryText'

export interface Props {
  invitation: any
  selected?: boolean
}

export default function InvitationListItem(props: Props) {
  const { invitation, selected } = props
  return (
    <ListMenuItem selected={selected}>
      <div className="Invitation">
        <Badge icon="envelope" backgroundColor={invitation.doc && invitation.doc.backgroundColor} />
        <div className="Invitation__body">
          <Text>{invitation.doc.title || 'Untitled'}</Text>
          <SecondaryText>From {invitation.sender.name}</SecondaryText>
        </div>
      </div>
      <div>
        <SecondaryText>⏎ View</SecondaryText>
      </div>
    </ListMenuItem>
  )
}
