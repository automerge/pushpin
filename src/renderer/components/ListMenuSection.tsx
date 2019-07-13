import React from 'react'
import './ListMenuSection.css'

export interface Props {
  children: React.ReactNode
  title?: string
}

export default function ListMenuSection(props: Props) {
  return (
    <div className="ListMenuSection">
      {props.title && <div className="ListMenuSection-title">{props.title}</div>}
      {props.children}
    </div>
  )
}
