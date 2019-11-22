import React from 'react'
import './ListMenuSection.css'

export interface Props {
  children: React.ReactNode
  title?: string | React.ReactNode
}

export default function ListMenuSection({ title, children }: Props) {
  return (
    <div className="ListMenuSection">
      {title && <div className="ListMenuSection-title">{title}</div>}
      {children}
    </div>
  )
}
