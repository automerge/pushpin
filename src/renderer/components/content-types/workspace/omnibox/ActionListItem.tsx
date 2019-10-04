import React, { ReactNode } from 'react'
import Actions, { ActionItem } from './Actions'
import { PushpinUrl } from '../../../../ShareLink'
import ListMenuItem, { Stretch } from '../../../ListMenuItem'

export interface Props {
  contentUrl: PushpinUrl
  actions: ActionItem[]
  selected: boolean
  children: ReactNode
}

ActionListItem.defaultProps = {
  actions: [],
  selected: false,
}

// TODO: item highlighting
export default function ActionListItem(props: Props) {
  const { children, contentUrl, actions, selected } = props
  const [defaultAction] = actions
  const onClick = defaultAction ? defaultAction.callback(contentUrl) : undefined
  return (
    <ListMenuItem selected={selected} onClick={onClick}>
      <Stretch>{children}</Stretch>
      <Actions url={contentUrl} actions={actions} />
    </ListMenuItem>
  )
}
