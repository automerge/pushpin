import React from 'react'
import './ListMenu.css'

export interface Props {
  children: React.ReactNode
}

export default function ListMenu(props: Props) {
  return <div className="ListMenu">{props.children}</div>
}
