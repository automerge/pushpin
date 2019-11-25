import React, { ReactNode } from 'react'
import './FillParent.css'

export interface Props {
  maxWidth?: number
  maxHeight?: number
  children: ReactNode
}

/**
 * FillParent
 * A simple wrapper div to fill the parent element.
 * */
export default function FillParent(props: Props) {
  const style: any = {}
  props.maxWidth && (style.maxWidth = props.maxWidth)
  props.maxHeight && (style.maxHeight = props.maxHeight)
  return (
    <div className="FillParent" style={style}>
      {props.children}
    </div>
  )
}
