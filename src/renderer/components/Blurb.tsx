import React from 'react'
import './Blurb.css'

export interface Props {
  style?: React.CSSProperties
  children: React.ReactNode
}

export default function Blurb(props: Props) {
  return (
    <span className="Blurb" style={props.style}>
      {props.children}
    </span>
  )
}
