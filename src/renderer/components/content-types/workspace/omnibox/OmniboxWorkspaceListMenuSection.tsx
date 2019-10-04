import React from 'react'
import ActionListItem from './ActionListItem'
import ListMenuSection from '../../../ListMenuSection'
import { Action, Item } from './OmniboxWorkspaceListMenu'
import Content from '../../../Content'

interface Props {
  name: string
  label?: string
  actions: Action[]
  items: Item[]
}

export default function OmniboxWorkspaceListMenuSection({ name, label, actions, items }: Props) {
  if (items.length === 0) {
    return null
  }
  return (
    <ListMenuSection key={name} title={label}>
      {items.map(
        ({ url, selected }) =>
          url && (
            <ActionListItem key={url} contentUrl={url} actions={actions} selected={selected}>
              <Content context="list" url={url} />
            </ActionListItem>
          )
      )}
    </ListMenuSection>
  )
}
