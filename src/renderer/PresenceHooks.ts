import { HypermergeUrl, parseDocumentLink } from "./ShareLink";
import { useState, useEffect, useContext } from "react";
import { useTimeouts, useMessaging, useRepo } from "./Hooks";
import { CurrentDeviceContext } from "./components/content-types/workspace/Device";

const heartbeats: { [url: string]: number } = {} // url: HypermergeUrl
const HEARTBEAT_INTERVAL = 1000 // ms

interface HeartbeatMessage {
  contact: HypermergeUrl
  device: HypermergeUrl
  heartbeat?: boolean
  departing?: boolean
  data?: any
}

/**
 * Send all the heartbeats associated with every document
 * @param selfId
 */
export function useAllHeartbeats(selfId: HypermergeUrl | null) {
  const repo = useRepo()
  const currentDeviceId = useContext(CurrentDeviceContext)
  const parsed = parseDocumentLink(currentDeviceId || '')
  const currentDeviceHypermergeUrl = parsed.hypermergeUrl || null

  useEffect(() => {
    if (!selfId) {
      return () => { }
    }
    if (!currentDeviceHypermergeUrl) {
      return () => { }
    }

    const interval = setInterval(() => {
      // Post a presence heartbeat on documents currently considered
      // to be open, allowing any kind of card to render a list of "present" folks.
      Object.entries(heartbeats).forEach(([url, count]) => {
        if (count > 0) {
          const outboundMessage: HeartbeatMessage = {
            contact: selfId,
            device: currentDeviceHypermergeUrl,
            heartbeat: true,
            data: myPresence[url],
          }

          // we can't use HypermergeUrl as a key in heartbeats, so we do this bad thing
          repo.message(url as HypermergeUrl, outboundMessage)
        } else {
          depart(url as HypermergeUrl)
          delete heartbeats[url]
        }
      })
    }, HEARTBEAT_INTERVAL)

    function depart(url: HypermergeUrl) {
      if (!selfId || !currentDeviceHypermergeUrl) {
        return
      }
      const departMessage: HeartbeatMessage = {
        contact: selfId,
        device: currentDeviceHypermergeUrl,
        departing: true,
      }
      repo.message(url, departMessage)
    }

    return () => {
      clearInterval(interval)
      // heartbeats can't have HypermergeUrls as keys, so we do this
      Object.entries(heartbeats).forEach(([url]) => depart(url as HypermergeUrl))
    }
  }, [selfId, currentDeviceId])
}

export function useHeartbeat(docUrl: HypermergeUrl | null) {
  useEffect(() => {
    if (!docUrl) {
      return () => { }
    }

    heartbeats[docUrl] = (heartbeats[docUrl] || 0) + 1

    return () => {
      heartbeats[docUrl] && (heartbeats[docUrl] -= 1)
    }
  }, [docUrl])
}

export interface RemotePresence<P> {
  contact: HypermergeUrl
  device: HypermergeUrl
  data?: P
}

export interface RemotePresenceCache<P> {
  [contactAndDevice: string]: RemotePresence<P>
}

const myPresence: { [url: string /* HypermergeUrl */]: { [key: string]: any } } = {}

function remotePresenceToLookupKey<T>(presence: RemotePresence<T>): string {
  return `${presence.contact}-${presence.device}`
}
function lookupKeyToPresencePieces(key: string): [HypermergeUrl, HypermergeUrl] {
  const [contact, device] = key.split('-')
  return [contact as HypermergeUrl, device as HypermergeUrl]
}

export function usePresence<P>(
  url: HypermergeUrl | null,
  presence: P | null,
  key: string = '/'
): RemotePresence<P>[] {
  const [remote, setRemoteInner] = useState<RemotePresenceCache<P>>({})
  const setSingleRemote = (presence: RemotePresence<P>) => {
    setRemoteInner((prev) => ({
      ...prev,
      [remotePresenceToLookupKey(presence)]: { ...presence },
    }))
  }
  const [bumpTimeout, depart] = useTimeouts(5000, (key: string) => {
    const [contact, device] = lookupKeyToPresencePieces(key)
    setSingleRemote({ contact, device, data: undefined })
  })

  useMessaging<any>(url, (msg: HeartbeatMessage) => {
    const { contact, device, heartbeat, departing, data } = msg
    const presence = { contact, device, data }
    if (heartbeat && data) {
      bumpTimeout(remotePresenceToLookupKey(presence))
      setSingleRemote(presence)
    } else if (departing) {
      depart(remotePresenceToLookupKey(presence))
    }
  })

  useEffect(() => {
    if (!url || !key) return () => { }

    if (!myPresence[url]) {
      myPresence[url] = {}
    }

    myPresence[url][key] = presence

    return () => {
      delete myPresence[url][key]
    }
  }, [key, presence])

  return Object.values(remote)
    .filter((presence) => presence.data)
    .map((presence) => ({ ...presence, data: presence.data![key] }))
}
