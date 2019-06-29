import React from 'react'

import ListMenuItem from './ListMenuItem'

interface Props {
  name: string,
  label: string,
  actions: any[],
  items: any[]
}

export default function ContentSection({ name, label, actions, items }: Props) {
  const renderedItems = items.map(({ url, selected }) =>
    <ListMenuItem key={url} contentUrl={url} actions={actions} selected={selected} />)

  const labelPartial = label ? <div className="ListMenu__segment">{label}</div> : null

  return (
    <div>
      {labelPartial}
      <div className="ListMenu__section">
        {renderedItems}
      </div>
    </div>
  )
}