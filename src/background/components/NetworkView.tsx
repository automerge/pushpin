import React from 'react'
import { DocUrl } from 'hypermerge'
import { useRepo, useSample } from '../BackgroundHooks'
import Card from './Card'
import Info from './Info'

interface Props {
  url?: DocUrl
}

export default function NetworkView(props: Props) {
  const samples = useSample(3000)

  const repo = useRepo()
  const { network } = repo

  const peers = Array.from(network.peers.values())

  return (
    <div
      style={{
        display: 'grid',
        gridGap: 8,
      }}
    >
      <Info samples={samples} peers={peers.length} joined={network.joined.size} />

      {peers.map((peer) => (
        <Card key={peer.id}>{peer.id}</Card>
      ))}
    </div>
  )
}
