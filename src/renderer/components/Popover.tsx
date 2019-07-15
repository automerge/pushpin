import React from 'react'

import './Popover.css'

export interface Props {
  children: React.ReactNode
}

export default function Popover(props: Props) {
  return <div className="Popover">{props.children}</div>
}
