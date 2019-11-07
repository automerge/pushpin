import React, { ReactNode, useRef } from 'react'
import './Heading.css'
import { PushpinUrl } from '../ShareLink'

export interface Props {
  url: PushpinUrl
  children: ReactNode
}

export default function ContentDragHandle(props: Props) {
  const { url, children } = props
  const ref = useRef<HTMLSpanElement>(null)

  const onDragStart = (event: React.DragEvent<HTMLSpanElement>) => {
    if (ref.current) {
      event.dataTransfer.setDragImage(ref.current, 0, 0)
    }

    event.dataTransfer.setData('text/uri-list', url)
  }

  return (
    <span draggable ref={ref} onDragStart={onDragStart}>
      {children}
    </span>
  )
}
