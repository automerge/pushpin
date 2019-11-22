import React from 'react'
import { PeerId } from 'hypermerge/dist/NetworkPeer'
import PeerConnection from 'hypermerge/dist/PeerConnection'
import Info, { humanBytes, hidden, hiddenList } from './Info'
import List from './List'
import { useSample, useRepo } from '../BackgroundHooks'
import Card from './Card'
import FeedView from './FeedView'
import LimitedList from './LimitedList'

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
        weHaveAuthority={peer.weHaveAuthority}
        connection={connectionInfo(peer.connection)}
        closed={`${peer.closedConnectionCount} connections`}
        pending={hiddenList(peer.pendingConnections, 'connection', connectionInfo)}
      />

      <Info
        shared={hidden(`${shared.size} feeds...`, () => (
          <LimitedList limit={30} items={Array.from(shared)}>
            {(items) => (
              <List>
                {items.map((discoveryId) => (
                  <Card key={discoveryId}>
                    <FeedView feedId={feeds.info.getPublicId(discoveryId)!} />
                  </Card>
                ))}
              </List>
            )}
          </LimitedList>
        ))}
      />
    </div>
  )
}

export function connectionInfo(conn?: PeerConnection) {
  const rawConn = conn as any

  if (!conn) return 'No connection'

  return {
    type: conn.type,
    isConnected: conn.isOpen,
    id: conn.id,
    host: rawConn.rawSocket.remoteAddress,
    port: rawConn.rawSocket.remotePort,
    sent: humanBytes(rawConn.rawSocket.bytesWritten),
    received: humanBytes(rawConn.rawSocket.bytesRead),
    isClient: conn.isClient,
  }
}
