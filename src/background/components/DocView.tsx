import React from 'react'
import { DocUrl } from 'hypermerge'
import { validateDocURL } from 'hypermerge/dist/Metadata'
import { toDiscoveryId } from 'hypermerge/dist/Misc'
import { useRepo } from '../BackgroundHooks'
import FeedView from './FeedView'
import Card from './Card'
import Info, { hidden } from './Info'
import PeersView from './PeersView'

interface Props {
  url: DocUrl
}

export default function DocView({ url }: Props) {
  const repo = useRepo()
  const id = validateDocURL(url)

  const clock = repo.cursors.get(repo.id, id)
  const actorIds = Object.keys(clock) as any[]
  const doc = repo.docs.get(id)

  return (
    <div
      style={{
        display: 'grid',
        gridGap: 8,
      }}
    >
      <Info log={doc} docUrl={url} clock={renderClock(doc && doc.clock)} />

      <hr />
      <Info feeds={actorIds.length} />
      {actorIds.map((actorId) => (
        <Card key={actorId}>
          <FeedView feedId={actorId} />
        </Card>
      ))}

      <hr />
      <PeersView discoveryId={toDiscoveryId(id)} />
    </div>
  )
}

function renderClock(clock: any) {
  if (!clock) return null
  return hidden(`${Object.keys(clock).length} actors...`, () => clock)
}
