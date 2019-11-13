import React from 'react'
import './CenteredStack.css'

type Row = 'row'
type Column = 'column'
type Direction = Row | Column

export interface Props {
  direction?: Direction
  style?: React.CSSProperties
  children: React.ReactNode
}

export default function CenteredStack(props: Props) {
  return (
    <span
      className="CenteredStack"
      style={{ flexDirection: props.direction || 'column', ...props.style }}
    >
      {props.children}
    </span>
  )
}
