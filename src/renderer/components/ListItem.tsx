import React, { ReactNode } from 'react'
// todo import './ListItem.css'

export interface Props {
  children: ReactNode
}

/**
 * ListItem
 * A standard form for list items to render with a badge, a title, and a subtitle.
 * */
export default function ListItem(props: Props) {
  return <div className="UrlListItem">{props.children}</div>
}
