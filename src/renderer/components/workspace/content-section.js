import React from 'react'
import PropTypes from 'prop-types'

import ListMenuItem from './ListMenuItem'

export default function ContentSection({ name, label, actions, items }) {
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

ContentSection.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(PropTypes.any).isRequired,
  items: PropTypes.arrayOf(PropTypes.any).isRequired
}
