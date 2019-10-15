import ContentTypes from '../../../ContentTypes'
import { HypermergeUrl } from '../../../ShareLink'

import StoragePeerWorkspace from './StoragePeerWorkspace'
import StoragePeer from './StoragePeer'
import { DeviceDoc } from '../workspace/Device'

export interface StoragePeerDoc extends DeviceDoc {
  storedUrls: { [contact: string /* HypermergeUrl */]: HypermergeUrl }
}

function create(typeAttrs, handle, callback) {
  throw new Error('we cannot (meaningfully) create storage peer documents inside pushpin')
}

ContentTypes.register({
  type: 'storage-peer',
  name: 'Storage Peer',
  icon: 'cloud',
  resizable: true,
  unlisted: true,
  create,
  contexts: {
    workspace: StoragePeerWorkspace,
    board: StoragePeer,
    list: StoragePeer,
  },
})
