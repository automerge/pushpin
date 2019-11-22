import React, { ReactNode } from 'react'
import './MaxWidth.css'

export interface Props {
  children: ReactNode
}

/**
 * MaxWidth
 * A simple wrapper div to enforce a maximum width.
 * */
export default function MaxWidth(props: Props) {
  return <div className="MaxWidth">{props.children}</div>
}
