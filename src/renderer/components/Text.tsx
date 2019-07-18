import React, { CSSProperties } from 'react'
import './Text.css'

export interface Props {
  children: React.ReactNode
  style?: CSSProperties
}

export default function Text(props: Props) {
  return (
    <span className="Text" style={props.style}>
      {props.children}
    </span>
  )
}
