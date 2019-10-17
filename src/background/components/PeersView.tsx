import React from 'react'
import { DiscoveryId } from 'hypermerge/dist/Misc'
import { useRepo, useSample } from '../BackgroundHooks'
import PeerView from './PeerView'
import Card from './Card'
import Info from './Info'

interface Props {
  discoveryId: DiscoveryId
}

export default function PeersView({ discoveryId }: Props) {
  useSample(3000)

  const repo = useRepo()
  const peers = repo.replication.getPeersWith([discoveryId])

  return (
    <>
      <Info peers={peers.size} />

      {Array.from(peers).map((peer) => (
        <Card key={peer.id}>
          <PeerView peerId={peer.id} />
        </Card>
      ))}
    </>
  )
}
