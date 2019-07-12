import React, { CSSProperties, ReactChild } from 'react'
import './Heading.css'

export interface Props {
  style?: CSSProperties
  children: ReactChild
}

export default function Heading(props: Props) {
  return (
    <h1 className="Heading" style={props.style}>
      {props.children}
    </h1>
  )
}
