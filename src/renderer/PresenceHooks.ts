import { useState, useEffect, useContext } from 'react'
import { HypermergeUrl, parseDocumentLink } from './ShareLink'
import { useTimeouts, useMessaging, useRepo } from './Hooks'
import { CurrentDeviceContext } from './components/content-types/workspace/Device'

/**
 * heartbeats are an accumulated list of the URLs we have "open" and so should
 * report heartbeats (and forward our "presence data") to.
 */
const heartbeats: { [url: string]: number } = {} // url: HypermergeUrl
/**
 * myPresence is the data (per-url) that we send to our peers
 */
const myPresence: { [url: string /* HypermergeUrl */]: { [key: string]: any } } = {}

const HEARTBEAT_INTERVAL = 1000 // ms

export interface RemotePresence<P> {
  contact: HypermergeUrl
  device: HypermergeUrl
  data?: P
}

export interface RemotePresenceCache<P> {
  [contactAndDevice: string]: RemotePresence<P>
}

interface HeartbeatMessage {
  contact: HypermergeUrl
  device: HypermergeUrl
  subject: HypermergeUrl // for testing, remove this
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
      return () => {}
    }
    if (!currentDeviceHypermergeUrl) {
      return () => {}
    }

    const interval = setInterval(() => {
      console.log('send heartbeats', Date.now())
      // Post a presence heartbeat on documents currently considered
      // to be open, allowing any kind of card to render a list of "present" folks.
      Object.entries(heartbeats).forEach(([url, count]) => {
        if (count > 0) {
          const msg: HeartbeatMessage = {
            contact: selfId,
            device: currentDeviceHypermergeUrl,
            heartbeat: true,
            subject: url as HypermergeUrl,
            data: myPresence[url],
          }
          console.log(
            `[${selfId!.slice(12, 17)}-${currentDeviceHypermergeUrl!.slice(12, 17)}] => ${url}`,
            msg.data
          )
          // we can't use HypermergeUrl as a key in heartbeats, so we do this bad thing
          repo.message(url as HypermergeUrl, msg)
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
        subject: url as HypermergeUrl,
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
      return () => {}
    }

    heartbeats[docUrl] = (heartbeats[docUrl] || 0) + 1

    return () => {
      heartbeats[docUrl] && (heartbeats[docUrl] -= 1)
    }
  }, [docUrl])
}

function remotePresenceToLookupKey<T>(presence: RemotePresence<T>): string {
  return `${presence.contact}-${presence.device}`
}
function lookupKeyToPresencePieces(key: string): [HypermergeUrl, HypermergeUrl] {
  const [contact, device] = key.split('-')
  return [contact as HypermergeUrl, device as HypermergeUrl]
}

export function usePresence<P>(
  url: HypermergeUrl | null,
  presence?: P,
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
    const { contact, device, heartbeat, departing, data, subject } = msg
    console.log(
      `[${contact!.slice(12, 17)}-${device!.slice(12, 17)}] -> ${url} / ${subject}`,
      msg.data
    )
    const presence = { contact, device, data }
    if (heartbeat || data) {
      bumpTimeout(remotePresenceToLookupKey(presence))
      setSingleRemote(presence)
    } else if (departing) {
      depart(remotePresenceToLookupKey(presence))
    }
  })

  useEffect(() => {
    if (!url || !key) return () => {}

    if (!myPresence[url]) {
      myPresence[url] = {}
    }

    if (presence === undefined) {
      delete myPresence[url][key]
    } else {
      myPresence[url][key] = presence
    }

    return () => {
      delete myPresence[url][key]
    }
  }, [key, presence])

  return Object.values(remote)
    .filter((presence) => presence.data)
    .map((presence) => ({ ...presence, data: presence.data![key] }))
}
