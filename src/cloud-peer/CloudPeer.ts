import { Repo, Handle } from 'hypermerge/dist'
import * as Traverse from './Traverse'
import * as ShareLink from '../renderer/ShareLink'

const debug = require('debug')('cloud-peer')

// TODO: Inspect blocks for links rather than traversing the doc.
// We currently re-traverse documents on every update. We could instead
// check the operations in each block for links and swarm them if we've never
// seen them.
export class CloudPeer {
  repo: Repo
  handles: Map<string, Handle<any>>
  files: Set<string>

  constructor(repo: Repo) {
    this.repo = repo
    this.handles = new Map()
    this.files = new Set()
  }

  stats() {
    return {
      documents: this.handles.size,
      files: this.files.size,
      joined: this.repo.back.joined.size,
    }
  }

  swarm = (url: string) => {
    // Handle pushpin urls
    if (ShareLink.isPushpinUrl(url)) {
      debug(`Parsing pushpin url ${url}`)
      const { hypermergeUrl } = ShareLink.parseDocumentLink(url)
      this.swarm(hypermergeUrl)
    }
    // Handle hypermerge and hyperfile urls
    else if (!this.handles.has(url) && !this.files.has(url)) {
      // Is there a better way to ensure availability besides opening?
      if (ShareLink.isHypermergeUrl(url)) {
        debug(`Opening document ${url}`)
        const handle = this.repo.open(url)
        this.handles.set(url, handle)
        // The `subscribe` callback may be invoked immediately,
        // so use setImmediate to prevent locking on deep structures.
        setImmediate(() => handle.subscribe(this.onDocumentUpdate(url)))
      }
      /*
                              } else if (Hyperfile.isHyperfileUrl(url)) {
                                // We don't need to subscribe to hyperfile updates, we just need to swarm
                                this.files.add(url)
                                setImmediate(() =>
                                  this.repo.readFile(url, (data, mimetype) => {
                                    debug(`Read file ${url}`)
                                  })
                                )
                              }
                              */
    }
  }

  shouldSwarm = (val: any) => {
    // TODO: is hyperfile url
    return ShareLink.isHypermergeUrl(val) || ShareLink.isPushpinUrl(val)
  }

  onDocumentUpdate = (url: string) => {
    return (doc: any) => {
      debug(`Update for ${url}`)
      const urls = Traverse.iterativeDFS<string>(doc, this.shouldSwarm)
      urls.forEach(this.swarm)
    }
  }

  isSwarming = (url: string): boolean => {
    // TODO: Shouldn't have to figure out the discovery key here, hypermerge should do it.
    // TODO: turn into a key
    const { docId } = ShareLink.parts(url)
    if (!docId) return false
    // TODO: repo should expose an interface for this.
    return this.repo.back.joined.has(docId)
  }

  close = () => {
    this.handles.forEach((handle) => handle.close())
    this.handles.clear()
    this.files.clear()
  }
}
