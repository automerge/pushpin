import React from 'react'
import './CenteredStack.css'
import classNames from 'classnames'

type Row = 'row'
type Column = 'column'
type Direction = Row | Column

export interface Props {
  direction?: Direction
  centerText?: boolean
  style?: React.CSSProperties
  children: React.ReactNode
}

export default function CenteredStack({
  direction = 'column',
  centerText = true,
  style,
  children,
}: Props) {
  return (
    <span
      className={classNames([
        'CenteredStack',
        `CenteredStack--${direction}`,
        centerText && 'CenteredStack--centerText',
      ])}
      style={style}
    >
      {children}
    </span>
  )
}
