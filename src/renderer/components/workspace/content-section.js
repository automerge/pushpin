import React from 'react'
import PropTypes from 'prop-types'

import Content from '../content'
import Actions from './actions'

export default function ContentSection({ name, label, actions, items }) {
  const renderedItems = items.map((item) => {
    const { url } = item
    const classes = item.selected ? 'ListMenu__item ListMenu__item--selected' : 'ListMenu__item'

    return (
      <div key={url} className={classes}>
        <Actions url={url} actions={actions}>
          <Content context="list" url={url} />
        </Actions>
      </div>
    )
  })

  const labelPartial = label ? <div className="ListMenu__segment">{label}</div> : null

  return (
    <div>
      { labelPartial }
      <div className="ListMenu__section">
        { renderedItems }
      </div>
    </div>
  )
}

ContentSection.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(PropTypes.func).isRequired,
  items: PropTypes.arrayOf(PropTypes.any).isRequired
}
