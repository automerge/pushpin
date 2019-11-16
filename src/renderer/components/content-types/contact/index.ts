import { Handle } from 'hypermerge'
import * as ContentTypes from '../../../ContentTypes'
import { USER } from '../../../constants'
import { HypermergeUrl, PushpinUrl } from '../../../ShareLink'

import ContactEditor, { USER_COLORS } from './ContactEditor'
import ContactInVarious from './ContactInVarious'
import * as Crypto from '../../../Crypto'

import './Avatar.css'

export interface Box {
  box: Crypto.EncodedBox
  nonce: Crypto.EncodedBoxNonce
}

export interface ContactDoc {
  name: string
  color: string
  avatarDocId: HypermergeUrl
  hypermergeUrl: HypermergeUrl // Used by workspace
  offeredUrls?: { [url: string]: PushpinUrl[] } // Used by share, a map of contact id to documents offered.
  invites?: { [url: string]: Box[] }
  devices?: HypermergeUrl[]
  publicKey?: Crypto.SignedValue<Crypto.EncodedPublicEncryptionKey>
}

// TODO: Enforce this type in `ContentTypes`.
export interface TypeAttrs {
  publicKey: Crypto.EncodedPublicEncryptionKey
}

async function create(typeAttrs: TypeAttrs, handle: Handle<ContactDoc>) {
  const signedEncryptionKey = await Crypto.sign(handle.url, typeAttrs.publicKey)
  handle.change((doc) => {
    doc.name = USER!
    const USER_COLOR_VALUES = Object.values(USER_COLORS)
    const color = USER_COLOR_VALUES[Math.floor(Math.random() * USER_COLOR_VALUES.length)]
    doc.color = color
    doc.publicKey = signedEncryptionKey
  })
}

ContentTypes.register({
  type: 'contact',
  name: 'Contact',
  icon: 'sticky-note',
  resizable: true,
  unlisted: true,
  create,
  contexts: {
    workspace: ContactEditor,
    board: ContactInVarious,
    list: ContactInVarious,
    thread: ContactInVarious,
    'title-bar': ContactInVarious,
  },
})
