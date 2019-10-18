import React from 'react'
import { DocUrl } from 'hypermerge'
import { validateDocURL } from 'hypermerge/dist/Metadata'
import { toDiscoveryId } from 'hypermerge/dist/Misc'
import { Clock } from 'hypermerge/dist/Clock'
import { useRepo, useSample } from '../BackgroundHooks'
import FeedView from './FeedView'
import Card from './Card'
import Info, { hidden } from './Info'
import PeersView from './PeersView'
import List from './List'

interface Props {
  url: DocUrl
}

export default React.memo(DocView)

function DocView({ url }: Props) {
  useSample(2000)
  const repo = useRepo()
  const id = validateDocURL(url)

  const clock = repo.cursors.get(repo.id, id)
  const actorIds = Object.keys(clock) as any[]
  const doc = repo.docs.get(id)

  return (
    <List>
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
    </List>
  )
}

function renderClock(clock: Clock | undefined) {
  if (!clock) return null
  return hidden(`${Object.keys(clock).length} actors...`, () => clock)
}
