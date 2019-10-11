import React from 'react'
import { DocUrl } from 'hypermerge'
import { useRepo, useSample } from '../BackgroundHooks'
import Card from './Card'
import Info, { hidden } from './Info'
import PeerView from './PeerView'

interface Props {
  url?: DocUrl
}

export default function NetworkView(props: Props) {
  useSample(3000)

  const { network } = useRepo()

  const peers = Array.from(network.peers.values())

  return (
    <div
      style={{
        display: 'grid',
        gridGap: 8,
      }}
    >
      <Info
        log={network}
        selfId={network.selfId}
        joined={hidden(`${network.joined.size} discoveryIds`, Array.from(network.joined))}
        closedConnections={network.closedConnectionCount}
      />
      <hr />
      <Info peers={peers.length} />
      {peers.map((peer) => (
        <Card key={peer.id}>
          <PeerView peerId={peer.id} />
        </Card>
      ))}
    </div>
  )
}
