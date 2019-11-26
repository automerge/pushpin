import React from 'react'
import './SecondaryText.css'

export interface Props {
  style?: React.CSSProperties
  children: React.ReactNode
}

export default function SecondaryText(props: Props) {
  return (
    <span className="SecondaryText" style={props.style}>
      {props.children}
    </span>
  )
}
