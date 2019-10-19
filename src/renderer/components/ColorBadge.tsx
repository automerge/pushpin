import React from 'react'
import './ColorBadge.css'

export interface Props {
  color: string
}
export default function ColorBadge({ color }: Props) {
  return <div className="ColorBadge" style={{ backgroundColor: color }} />
}
