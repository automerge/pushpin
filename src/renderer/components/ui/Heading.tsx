import React, { CSSProperties, ReactChild } from 'react'
import './Heading.css'
import classNames from 'classnames'

export interface Props {
  style?: CSSProperties
  wrap?: boolean
  children: ReactChild
}

export default function Heading(props: Props) {
  return (
    <h1 className={classNames('Heading', props.wrap && 'Heading--wrap')} style={props.style}>
      {props.children}
    </h1>
  )
}
