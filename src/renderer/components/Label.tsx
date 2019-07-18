import React from 'react'

import './Label.css'

export interface Props {
  children: React.ReactNode
}

export default function Label(props: Props) {
  return <div className="Label">{props.children}</div>
}
