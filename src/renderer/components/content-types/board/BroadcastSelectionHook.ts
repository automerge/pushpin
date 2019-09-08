import { DocUrl } from 'hypermerge'
import { useState, useRef } from 'react'
import { HypermergeUrl } from '../../../ShareLink'
import { CardId } from '.'
import { useMessaging, useRepo } from '../../../Hooks'

interface RemoteSelectionData {
  [contact: string]: string[] | undefined // technically, undefined is not an option but...
}

type SendSelectionFn = (selection: string[]) => void

interface RemoteSelectionMessage {
  contact: DocUrl
  selected: CardId[]
  depart: boolean
}

// a custom hook for selections. XXX: clean up and move this
export const useRemoteSelections = (
  url: HypermergeUrl,
  selfId: DocUrl
): [RemoteSelectionData, SendSelectionFn] => {
  const [remoteSelection, setRemoteSelection] = useState<RemoteSelectionData>({})
  const contactHeartbeatTimerIds = useRef({})
  const repo = useRepo() // for repo.message

  // selection broadcasting... this could be cleaner.
  useMessaging<RemoteSelectionMessage>(url, (msg) => {
    const { contact, selected, depart } = msg

    if (contact) {
      clearTimeout(contactHeartbeatTimerIds.current[contact])
      // if we miss two heartbeats (11s), assume they've gone offline
      contactHeartbeatTimerIds.current[contact] = setTimeout(() => {
        setRemoteSelection({ ...remoteSelection, [contact]: undefined })
      }, 5000)
    }

    if (selected) {
      setRemoteSelection({ ...remoteSelection, [contact]: selected })
    }

    if (depart) {
      setRemoteSelection({ ...remoteSelection, [contact]: undefined })
    }
  })

  const sendFn = (selected) => repo.message(url, { contact: selfId, selected })

  return [remoteSelection, sendFn]
}
