import React from 'react'
import { PeerId, PeerConnection } from 'hypermerge/dist/NetworkPeer'
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
    </div>
  )
}

export function connectionInfo(conn?: PeerConnection<any>) {
  if (!conn) return 'None'

  return {
    type: conn.type,
    isOpen: conn.isOpen,
    isClient: conn.isClient,
    sent: bytes(conn.socket.bytesWritten),
    received: bytes(conn.socket.bytesRead),
    host: conn.socket.remoteAddress,
    port: conn.socket.remotePort,
  }
}

const mags = ['', 'KB', 'MB', 'GB']
export function bytes(n: number): string {
  let mag = 0
  while (n > 1024) {
    n /= 1024
    mag += 1
  }
  n = Math.round(n * 100) / 100
  return `${n} ${mags[mag]}`
}
