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
  const peerIds = repo.network.peerDiscoveryIds.get(discoveryId)

  return (
    <>
      <Info peers={peerIds.size} />

      {Array.from(peerIds).map((peerId) => (
        <Card key={peerId}>
          <PeerView peerId={peerId} />
        </Card>
      ))}
    </>
  )
}
