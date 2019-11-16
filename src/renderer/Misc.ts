import { RepoFrontend, Doc } from 'hypermerge'
import { HypermergeUrl } from './ShareLink'

export function getDoc<T>(repo: RepoFrontend, url: HypermergeUrl): Promise<Doc<T>> {
  return new Promise((res) => {
    repo.doc<T>(url, (doc) => res(doc))
  })
}
