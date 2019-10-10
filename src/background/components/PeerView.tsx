import React from 'react'
import { PeerId } from 'hypermerge/dist/NetworkPeer'
import PeerConnection from 'hypermerge/dist/PeerConnection'
import Info from './Info'
import { useSample, useRepo } from '../BackgroundHooks'

interface Props {
  peerId: PeerId
}

export default function PeerView({ peerId }: Props) {
  useSample(1000)
  const repo = useRepo()
  const peer = repo.network.peers.get(peerId)

  if (!peer) return <div>Peer not found: {peerId}</div>

  return (
    <div>
      <Info peerId={peerId} connection={connectionInfo(peer.connection)} />
      {Array.from(peer.pendingConnections).map((conn) => (
        <Info {...connectionInfo(conn)} />
      ))}
    </div>
  )
}

export function connectionInfo(conn: PeerConnection) {
  const rawConn = conn as any

  return {
    type: conn.type,
    isOpen: conn.isOpen,
    isClient: conn.isClient,
    host: rawConn.rawSocket.remoteAddress,
    port: rawConn.rawSocket.remotePort,
    sent: bytes(rawConn.rawSocket.bytesWritten),
    received: bytes(rawConn.rawSocket.bytesRead),
  }
}

const mags = ['', 'KB', 'MB', 'GB']
export function bytes(n?: number): string {
  if (n == null) return 'N/A'

  let mag = 0
  while (n > 1024) {
    n /= 1024
    mag += 1
  }
  n = Math.round(n * 100) / 100
  return `${n} ${mags[mag]}`
}
