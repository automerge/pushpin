import React from 'react'

import Content from '../../Content'
import Actions, { ActionItem } from './Actions'
import { PushpinUrl } from '../../../ShareLink'
import ListMenuItem, { Stretch } from '../../ListMenuItem'

export interface Props {
  contentUrl: PushpinUrl
  actions: ActionItem[]
  selected: boolean
}

ActionListItem.defaultProps = {
  actions: [],
  selected: false,
}

// TODO: item highlighting
export default function ActionListItem(props: Props) {
  const { contentUrl, actions, selected } = props
  const [defaultAction] = actions
  const onClick = defaultAction ? defaultAction.callback(contentUrl) : undefined
  return (
    <ListMenuItem selected={selected} onClick={onClick}>
      <Stretch>
        <Content context="list" url={contentUrl} />
      </Stretch>
      <Actions url={contentUrl} actions={actions} />
    </ListMenuItem>
  )
}
