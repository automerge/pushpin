import React from 'react'
import { PeerId } from 'hypermerge/dist/NetworkPeer'
import PeerConnection from 'hypermerge/dist/PeerConnection'
import Info, { humanBytes, hidden } from './Info'
import List from './List'
import { useSample, useRepo } from '../BackgroundHooks'
import Card from './Card'
import FeedView from './FeedView'

interface Props {
  peerId: PeerId
}
export default React.memo(PeerView)

function PeerView({ peerId }: Props) {
  useSample(1000)

  const { network, feeds, replication } = useRepo()
  const peer = network.peers.get(peerId)

  if (!peer) return <div>Peer not found: {peerId}</div>

  const shared = replication.replicating.get(peer)

  return (
    <div>
      <Info
        log={peer}
        peerId={peerId}
        connection={connectionInfo(peer.connection)}
        closedConnections={peer.closedConnectionCount}
      />
      {Array.from(peer.pendingConnections).map((conn, i) => (
        <Info key={String(i)} log={conn} {...connectionInfo(conn)} />
      ))}
      <Info
        shared={hidden(`${shared.size} feeds...`, () => (
          <List>
            {Array.from(shared).map((discoveryId) => (
              <Card key={discoveryId}>
                <FeedView feedId={feeds.info.getPublicId(discoveryId)!} />
              </Card>
            ))}
          </List>
        ))}
      />
    </div>
  )
}

export function connectionInfo(conn: PeerConnection) {
  const rawConn = conn as any

  if (!conn) return 'No connection'

  return {
    type: conn.type,
    isConnected: conn.isOpen,
    host: rawConn.rawSocket.remoteAddress,
    port: rawConn.rawSocket.remotePort,
    sent: humanBytes(rawConn.rawSocket.bytesWritten),
    received: humanBytes(rawConn.rawSocket.bytesRead),
  }
}
