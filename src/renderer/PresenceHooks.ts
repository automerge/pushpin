import { useState, useEffect, useContext } from 'react'
import { HypermergeUrl, parseDocumentLink, createDocumentLink, PushpinUrl } from './ShareLink'
import { useTimeouts, useMessaging, useRepo, useSelfId } from './Hooks'
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
  heartbeat?: boolean
  departing?: boolean
  data?: any
}

/**
 * Send all the heartbeats associated with every document
 * @param contact: (selfId HypermergeUrl)
 */
export function useAllHeartbeats(contact: HypermergeUrl | null) {
  const repo = useRepo()
  const currentDeviceId = useContext(CurrentDeviceContext)
  const parsed = parseDocumentLink(currentDeviceId || '')
  const device = parsed.hypermergeUrl || null

  useEffect(() => {
    if (!contact) {
      return () => {}
    }
    if (!device) {
      return () => {}
    }

    const interval = setInterval(() => {
      // Post a presence heartbeat on documents currently considered
      // to be open, allowing any kind of card to render a list of "present" folks.
      Object.entries(heartbeats).forEach(([url, count]) => {
        if (count > 0) {
          const msg: HeartbeatMessage = {
            contact,
            device,
            heartbeat: true,
            data: myPresence[url],
          }
          // we can't use HypermergeUrl as a key in heartbeats, so we do this bad thing
          repo.message(url as HypermergeUrl, msg)
        } else {
          depart(url as HypermergeUrl)
          delete heartbeats[url]
        }
      })
    }, HEARTBEAT_INTERVAL)

    function depart(url: HypermergeUrl) {
      if (!contact || !device) {
        return
      }
      const departMessage: HeartbeatMessage = {
        contact,
        device,
        departing: true,
      }
      repo.message(url, departMessage)
    }

    return () => {
      clearInterval(interval)
      // heartbeats can't have HypermergeUrls as keys, so we do this
      Object.entries(heartbeats).forEach(([url]) => depart(url as HypermergeUrl))
    }
  }, [contact, device])
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

function useRemotePresence<P>(url: HypermergeUrl | null, topic: string = '/') {
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
    if (heartbeat || data) {
      bumpTimeout(remotePresenceToLookupKey(presence))
      setSingleRemote(presence)
    } else if (departing) {
      depart(remotePresenceToLookupKey(presence))
    }
  })
  return Object.values(remote)
    .filter((presence) => presence.data)
    .map((presence) => ({ ...presence, data: presence.data![topic] }))
}

export function usePresence<P>(
  url: HypermergeUrl | null,
  presence?: P,
  key: string = '/'
): RemotePresence<P>[] {
  const remotePresence = useRemotePresence<P>(url, key)

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

  return remotePresence
}

/**
 * For a given contact, return the device urls (as pushpin urls) which are online
 * devices for that context. Will return an empty array if no device is online for the contact.
 * If the contact is self (the current user), the current device will be listed first.
 */
export function useOnlineDevicesForContact(contact: HypermergeUrl | null): PushpinUrl[] {
  const selfId = useSelfId()
  const selfDevice = useContext(CurrentDeviceContext)

  const remotePresence = useRemotePresence(contact)
  const onlineRemotes = remotePresence.filter((p) => p.contact === contact)
  const remoteDevices = onlineRemotes.map((presence) =>
    createDocumentLink('device', presence.device)
  )

  if (selfId === contact && selfDevice) {
    remoteDevices.unshift(selfDevice)
  }
  return remoteDevices
}

/**
 * For a given device, return whether or not the device is online.
 * If the passed device is the current device, always returns true.
 */
export function useOnlineStatusForDevice(deviceUrl: HypermergeUrl | null): boolean {
  const localDevice = useContext(CurrentDeviceContext)
  const remotePresence = useRemotePresence(deviceUrl)
  const isSelf = localDevice && parseDocumentLink(localDevice).hypermergeUrl === deviceUrl
  return isSelf || remotePresence.some((p) => p.device === deviceUrl)
}

export function useOnlineStatus(contactId: HypermergeUrl | null): boolean {
  const onlineDevices = useOnlineDevicesForContact(contactId)
  return onlineDevices.length > 0
}
