import React, { EventHandler } from 'react'
import classnames from 'classnames'

export interface Props {
  children: React.ReactNode
  onClick?: EventHandler<React.MouseEvent>
  selected?: boolean
}

ListMenuItem.defaultProps = {
  selected: false,
}

// TODO: item highlighting
export default function ListMenuItem(props: Props) {
  const { children, onClick, selected } = props
  const [content, actions] = React.Children.toArray(children)

  const className = classnames([
    'ListMenuItem',
    {
      'ListMenuItem--withDefaultAction': !!onClick,
      'ListMenuItem--selected': selected,
    },
  ])

  return (
    <div className={className} onClick={onClick}>
      <div className="ListMenuItem-content">{content}</div>
      {actions && <div className="ListMenuItem-actions">{actions}</div>}
    </div>
  )
}
