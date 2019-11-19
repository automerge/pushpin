import React, { useState, useEffect } from 'react'
import { useRepo, useSample } from '../BackgroundHooks'
import Card from './Card'
import Info, { hidden } from './Info'
import PeerView from './PeerView'
import List from './List'

interface Props {}

export default function NetworkView(_props: Props) {
  useSample(3000)

  const { network } = useRepo()
  const connectivity = useConnectivity()

  const peers = Array.from(network.peers.values())

  return (
    <List>
      <Info
        log={network}
        selfId={network.selfId}
        joined={hidden(`${network.joined.size} discoveryIds`, () => Array.from(network.joined))}
        closedConnections={network.closedConnectionCount}
        connectivity={connectivity ?? 'Testing...'}
      />
      <hr />
      <Info peers={peers.length} />
      {peers.map((peer) => (
        <Card key={peer.id}>
          <PeerView peerId={peer.id} />
        </Card>
      ))}
    </List>
  )
}

function useConnectivity(): object | null {
  const { network } = useRepo()
  const [connectivity, setConnectivity] = useState<object | null>(null)

  useEffect(() => {
    if (!network.swarm) return () => {}
    let set = (v: any) => setConnectivity(v)
    for (const swarm of network.swarms.keys()) {
      const sw = swarm as any
      if (sw.connectivity) {
        /* eslint-disable no-loop-func */
        sw.connectivity((err: Error | null, worked: object) => {
          if (err) return set(err)
          return set(worked)
        })
      }
    }

    return () => {
      // NOTE(jeff): `set` is to prevent setting state after unmount
      set = () => {}
    }
  }, [network.swarm])

  return connectivity
}
