import React from 'react'

type Props = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export default function Card({ style, ...props }: Props) {
  return (
    <div
      {...props}
      style={{
        padding: 10,
        border: '1px solid silver',
        borderRadius: 2,
        ...style,
      }}
    />
  )
}
