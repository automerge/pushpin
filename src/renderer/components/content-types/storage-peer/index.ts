import { Crypto } from 'hypermerge'
import * as ContentTypes from '../../../ContentTypes'

import StoragePeerWorkspace from './StoragePeerWorkspace'
import StoragePeer from './StoragePeer'
import { DeviceDoc } from '../workspace/Device'

export interface StoragePeerDoc extends DeviceDoc {
  publicKey: Crypto.EncodedPublicEncryptionKey
  publicKeySignature: Crypto.EncodedSignature
  storedUrls: { [contact: string /* HypermergeUrl */]: Crypto.EncodedSealedBox }
}

function create(typeAttrs, handle) {
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
