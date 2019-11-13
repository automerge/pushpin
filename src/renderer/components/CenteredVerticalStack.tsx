import React from 'react'
import './CenteredVerticalStack.css'

export interface Props {
  style?: React.CSSProperties
  children: React.ReactNode
}

export default function CenteredVerticalStack(props: Props) {
  return (
    <span className="CenteredVerticalStack" style={props.style}>
      {props.children}
    </span>
  )
}
