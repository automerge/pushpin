import React from 'react'
import { DocUrl } from 'hypermerge'
import { validateDocURL } from 'hypermerge/dist/Metadata'
import { toDiscoveryId } from 'hypermerge/dist/Misc'
import { useRepo } from '../BackgroundHooks'
import FeedView from './FeedView'
import Card from './Card'
import Info from './Info'
import PeersView from './PeersView'

interface Props {
  url: DocUrl
}

export default function DocView({ url }: Props) {
  const repo = useRepo()
  const id = validateDocURL(url)

  const actorIds = repo.meta.actors(id)

  return (
    <div
      style={{
        display: 'grid',
        gridGap: 8,
      }}
    >
      <Info docUrl={url} feeds={String(actorIds.length)} />

      {actorIds.map((actorId) => (
        <Card key={actorId}>
          <FeedView feedId={actorId} />
        </Card>
      ))}
      <PeersView discoveryId={toDiscoveryId(id)} />
    </div>
  )
}
