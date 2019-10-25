import React from 'react'
import { FeedId, Feed } from 'hypermerge/dist/FeedStore'
import { useRepo } from '../BackgroundHooks'
import Info, { hidden } from './Info'
import Card from './Card'
import FeedView from './FeedView'
import List from './List'
import LimitedList from './LimitedList'

interface Props {}

export default function FeedStoreView(_props: Props) {
  const { feeds } = useRepo()
  const { info } = feeds
  const { loaded }: { loaded: Map<FeedId, Feed> } = feeds as any
  const feedIds = info.allPublicIds()

  return (
    <List>
      <Info
        log={feeds}
        saved={hidden(`${feedIds.length} feeds...`, () =>
          feedIds.map((feedId) => ({
            log: () => feeds.getFeed(feedId),
            ...info.byPublicId(feedId),
          }))
        )}
        loaded={`${loaded.size} feeds`}
      />
      <LimitedList items={Array.from(loaded.keys())} limit={50}>
        {(loaded) => (
          <>
            {loaded.map((feedId) => (
              <Card key={feedId}>
                <FeedView feedId={feedId} />
              </Card>
            ))}
          </>
        )}
      </LimitedList>
    </List>
  )
}
