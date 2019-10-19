import React from 'react'
import './List.css'

type Props = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export default function List(props: Props) {
  return <div {...props} className={`List ${props.className}`} />
}
