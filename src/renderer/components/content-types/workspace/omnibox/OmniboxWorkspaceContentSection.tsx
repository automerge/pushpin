import React from 'react'
import ActionListItem from './ActionListItem'
import ListMenuSection from '../../../ListMenuSection'
import { Section, Item } from './ListMenuInWorkspace'

interface Props extends Section {
  materializedItems: Item[]
}

export default function OmniboxWorkspaceContentSection({
  name,
  label,
  actions,
  materializedItems,
}: Props) {
  const items = materializedItems // XXX this is a bad name

  if (items.length === 0) {
    return null
  }
  return (
    <ListMenuSection key={name} title={label}>
      {items.map(
        ({ url, selected }) =>
          url && <ActionListItem key={url} contentUrl={url} actions={actions} selected={selected} />
      )}
    </ListMenuSection>
  )
}
