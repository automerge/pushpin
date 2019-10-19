import React from 'react'
import { joinSets } from 'hypermerge/dist/Misc'
import { useSample, useRepo } from '../BackgroundHooks'
import Info, { hidden } from './Info'
import PeerView from './PeerView'
import Card from './Card'
import List from './List'

export default function ReplicationView() {
  useSample(3000)

  const { replication } = useRepo()
  const { replicating } = replication
  const allReplicating = joinSets(replicating.values())
  const peers = replicating.keys()

  return (
    <List>
      <Info
        log={replication}
        replicating={hidden(`${allReplicating.size} feeds`, () =>
          Array.from(allReplicating.values())
        )}
      />
      <Info peers={peers.length} />
      {peers.map((peer) => (
        <Card key={peer.id}>
          <PeerView peerId={peer.id} />
        </Card>
      ))}
    </List>
  )
}
