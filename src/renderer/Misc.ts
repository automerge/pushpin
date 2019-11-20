import * as Automerge from 'automerge'
import { RepoFrontend } from 'hypermerge'
import { HypermergeUrl } from './ShareLink'

export function getDoc<T>(repo: RepoFrontend, url: HypermergeUrl): Promise<Automerge.Doc<T>> {
  return new Promise((res, rej) => {
    repo.doc<T>(url, res)
  })
}

/**
 * Helper function for removing an item from an Automerge list.
 */
export function without<T>(val: T, list: Automerge.List<T>) {
  const pos = list.findIndex((item) => item === val)
  if (!pos) return
  // The Automerge type for deleteAt is wrong.
  list.deleteAt!(pos)
}
