import { useStaticCallback, useSharedState } from '../../../Hooks'

export type Selection<T> = T[]

/*
 * Selection manipulation functions
 * these functional control the currently selected set of cards
 */
export function useSelection<T>(
  id: string
): {
  selection: Selection<T>
  selectToggle: (id: T) => void
  selectOnly: (id: T) => void
  selectNone: () => void
} {
  const [selection, setSelection] = useSharedState<T[]>(id, [])

  const selectToggle = useStaticCallback((id: T) =>
    setSelection((selected: T[]) =>
      selected.includes(id) ? selected.filter((filterId) => filterId !== id) : [...selected, id]
    )
  )

  const selectOnly = useStaticCallback((id: T) => {
    setSelection([id])
  })

  const selectNone = useStaticCallback(() => {
    setSelection([])
  })

  return { selection, selectOnly, selectToggle, selectNone }
}
