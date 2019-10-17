import React, { useState } from 'react'

interface Props {
  summary: React.ReactNode
  children: () => React.ReactNode
}

declare global {
  namespace React {
    interface DetailsHTMLAttributes<T> {
      onToggle?: ReactEventHandler<T>
    }
  }
}

export default function Expandable({ summary, children }: Props) {
  const [isOpen, setOpen] = useState(false)

  function onToggle() {
    setOpen(!isOpen)
  }

  return (
    <details open={isOpen} onToggle={onToggle}>
      <summary>{summary}</summary>
      {children()}
    </details>
  )
}
