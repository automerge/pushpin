import React from 'react'
import './ListMenuHeader.css'

export interface Props {
  children: React.ReactNode
}

export default function ListMenuHeader(props: Props) {
  return <div className="ListMenuHeader">{props.children}</div>
}
