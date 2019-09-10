import { useState } from 'react'
import { CardId } from '.'

type Selection = CardId[]

/*
 * Selection manipulation functions
 * these functional control the currently selected set of cards
 */
export function useSelection(): {
  selected: Selection
  selectToggle: (cardId: CardId) => void
  selectOnly: (cardId: CardId) => void
  selectNone: () => void
} {
  const [selected, setSelection] = useState<CardId[]>([])

  const selectToggle = (cardId: CardId) => {
    if (selected.includes(cardId)) {
      // remove from the current state if we have it
      const newSelection = selected.filter((filterId) => filterId !== cardId)
      setSelection(newSelection)
    } else {
      // add to the current state if we don't
      setSelection([...selected, cardId])
    }
  }

  const selectOnly = (cardId: CardId) => {
    setSelection([cardId])
  }

  const selectNone = () => {
    setSelection([])
  }

  return { selected, selectOnly, selectToggle, selectNone }
}
