import { useState } from 'react'
import { useStaticCallback } from '../../../Hooks'

type Selection<T> = T[]

/*
 * Selection manipulation functions
 * these functional control the currently selected set of cards
 */
export function useSelection<T>(): {
  selected: Selection<T>
  selectToggle: (id: T) => void
  selectOnly: (id: T) => void
  selectNone: () => void
} {
  const [selected, setSelection] = useState<T[]>([])

  const selectToggle = useStaticCallback((id: T) =>
    setSelection((selected) =>
      selected.includes(id) ? selected.filter((filterId) => filterId !== id) : [...selected, id]
    )
  )

  const selectOnly = useStaticCallback((id: T) => {
    setSelection([id])
  })

  const selectNone = useStaticCallback(() => {
    setSelection([])
  })

  return { selected, selectOnly, selectToggle, selectNone }
}
