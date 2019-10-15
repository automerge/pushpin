import React from 'react'
import { FeedId, Feed } from 'hypermerge/dist/FeedStore'
import { useRepo } from '../BackgroundHooks'
import Info from './Info'
import Card from './Card'
import FeedView from './FeedView'

interface Props {}

export default function FeedStoreView(_props: Props) {
  const { feeds } = useRepo()
  const { opened }: { opened: Map<FeedId, Feed> } = feeds as any

  return (
    <div style={{ display: 'grid', gridGap: 10 }}>
      <Info feeds={opened.size} />
      {Array.from(opened.keys()).map((feedId) => (
        <Card key={feedId}>
          <FeedView feedId={feedId} />
        </Card>
      ))}
    </div>
  )
}
