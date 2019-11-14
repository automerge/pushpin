import { RepoFrontend, Handle, DocUrl } from 'hypermerge/dist'
import { useEffect } from 'react'
import * as ShareLink from './ShareLink'
import * as Traverse from '../Traverse'
import { useRepo } from './Hooks'

export function usePreload(workspaceUrl?: ShareLink.HypermergeUrl) {
  const repo = useRepo()
  useEffect(() => {
    if (!repo || !workspaceUrl) return () => {}
    const preload = new Preloader(repo)
    preload.addRoot(workspaceUrl)

    return () => {
      preload.close()
    }
  }, [repo, workspaceUrl])
}

export class Preloader {
  repo: RepoFrontend
  seen: Set<string> = new Set()
  handles: Map<DocUrl, Handle<any>> = new Map()

  constructor(repo: RepoFrontend) {
    this.repo = repo
  }

  addRoot(url: string) {
    this.onUrl(url)
  }

  onUrl = (url: string) => {
    // Handle pushpin urls
    if (ShareLink.isPushpinUrl(url)) {
      const { hypermergeUrl } = ShareLink.parseDocumentLink(url)
      this.onUrl(hypermergeUrl)
    }
    // Handle hypermerge and hyperfile urls
    else if (!this.seen.has(url)) {
      // Is there a better way to ensure availability besides opening?
      if (ShareLink.isHypermergeUrl(url)) {
        const handle = this.repo.open(url)
        this.seen.add(url)
        this.handles.set(url, handle)
        // The `subscribe` callback may be invoked immediately,
        // so use setImmediate to prevent locking on deep structures.
        setImmediate(() => handle.subscribe(this.onDocumentUpdate(url)))
      } else if (ShareLink.isHyperfileUrl(url)) {
        // We don't need to subscribe to hyperfile updates, we just need to swarm
        this.seen.add(url)
        setImmediate(() => this.repo.files.header(url as any))
      }
    }
  }

  onDocumentUpdate = (url: string) => {
    return (doc: any) => {
      const urls = Traverse.iterativeDFS<string>(doc, isHypermergeUrl)
      urls.forEach(this.onUrl)
    }
  }

  close() {
    this.handles.forEach((handle) => handle.close())
    this.handles.clear()
    this.seen.clear()
  }
}

function isHypermergeUrl(val: unknown) {
  return (
    isString(val) &&
    (ShareLink.isHypermergeUrl(val) || ShareLink.isHyperfileUrl(val) || ShareLink.isPushpinUrl(val))
  )
}

function isString(val: unknown): val is string {
  return typeof val === 'string'
}
