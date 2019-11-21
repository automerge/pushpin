import * as Automerge from 'automerge'

/**
 * Helper function for removing an item from an Automerge list.
 */
export function without<T>(val: T, list: Automerge.List<T>) {
  const pos = list.findIndex((item) => item === val)
  if (!pos) return
  // The Automerge type for deleteAt is wrong.
  list.deleteAt!(pos)
}
