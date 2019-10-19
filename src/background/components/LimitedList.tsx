import React from 'react'
import Expandable from './Expandable'
import { humanNumber } from './Info'

export interface Props<T> {
  limit: number
  summary?: (remaining: number) => React.ReactNode
  items: T[]
  children: (items: T[]) => JSX.Element
}

export default function LimitedList<T>({
  limit,
  summary = (n) => `${humanNumber(n)} more...`,
  items,
  children: renderItems,
}: Props<T>) {
  const extra = items.length - limit

  return (
    <>
      {renderItems(items.slice(0, limit))}
      {extra > 0 ? (
        <Expandable summary={summary(extra)}>{() => renderItems(items.slice(limit))}</Expandable>
      ) : null}
    </>
  )
}
