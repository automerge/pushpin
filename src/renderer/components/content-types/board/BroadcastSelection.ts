import { DocUrl } from 'hypermerge'
import { useState, useRef } from 'react'
import { HypermergeUrl } from '../../../ShareLink'
import { CardId } from '.'
import { useMessaging, useRepo } from '../../../Hooks'

interface RemoteSelectionData {
  [contact: string]: string[] | undefined // technically, undefined is not an option but...
}

type SetSelectionFn = (selected: CardId[]) => void

type Selection = CardId[]

interface RemoteSelectionMessage {
  contact: DocUrl
  selected: Selection
  depart: boolean
}

/*
 * Selection manipulation functions
 * these functional control the currently selected set of cards
 * and broadcast changes to the set to your fellow editors
 */
export const useSelection = (
  url: HypermergeUrl,
  selfId: DocUrl
): {
  selected: Selection
  remoteSelection: RemoteSelectionData
  selectToggle: (CardId) => void
  selectOnly: (CardId) => void
  selectNone: () => void
} => {
  const [selected, setSelection] = useState<CardId[]>([])
  const [remoteSelection, broadcastSelection] = useRemoteSelections(url, selfId)

  const updateSelection = (selected: CardId[]) => {
    setSelection(selected)
    broadcastSelection(selected)
  }

  const selectToggle = (cardId: CardId) => {
    if (selected.includes(cardId)) {
      // remove from the current state if we have it
      const newSelection = selected.filter((filterId) => filterId !== cardId)
      updateSelection(newSelection)
    } else {
      // add to the current state if we don't
      updateSelection([...selected, cardId])
    }
  }

  const selectOnly = (cardId: CardId) => {
    updateSelection([cardId])
  }

  const selectNone = () => {
    updateSelection([])
  }

  return { selected, remoteSelection, selectOnly, selectToggle, selectNone }
}

// a private hook for tracking remote selections.
// XXX: rework the timer code to use hooks better?
const useRemoteSelections = (
  url: HypermergeUrl,
  selfId: DocUrl
): [RemoteSelectionData, SetSelectionFn] => {
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
