import { Crypto } from 'hypermerge'
import * as ContentTypes from '../../../ContentTypes'

import StoragePeerWorkspace from './StoragePeerWorkspace'
import StoragePeer from './StoragePeer'
import { DeviceDoc } from '../workspace/Device'

export interface StoragePeerDoc extends DeviceDoc {
  encryptionKey?: Crypto.EncodedPublicEncryptionKey
  encryptionKeySignature?: Crypto.EncodedSignature
  registry: { [contact: string /* HypermergeUrl */]: Crypto.EncodedSealedBoxCiphertext }
}

function create(_typeAttrs, _handle) {
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
    'title-bar': StoragePeer,
  },
})
