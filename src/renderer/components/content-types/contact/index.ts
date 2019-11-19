import { Handle, Crypto } from 'hypermerge'
import * as ContentTypes from '../../../ContentTypes'
import { USER } from '../../../constants'
import { HypermergeUrl } from '../../../ShareLink'

import ContactEditor, { USER_COLORS } from './ContactEditor'
import ContactInVarious from './ContactInVarious'

import './Avatar.css'

export interface ContactDoc {
  name: string
  color: string
  avatarDocId: HypermergeUrl
  hypermergeUrl: HypermergeUrl // Used by workspace
  invites: { [url: string]: Crypto.Box[] }
  devices?: HypermergeUrl[]
  encryptionKey?: Crypto.SignedMessage<Crypto.EncodedPublicEncryptionKey>
}

// TODO: Enforce this type in `ContentTypes`.
export interface TypeAttrs {
  encryptionKey: Crypto.EncodedPublicEncryptionKey
}

async function create(typeAttrs: TypeAttrs, handle: Handle<ContactDoc>) {
  const signedEncryptionKey = await window.repo.crypto.sign(handle.url, typeAttrs.encryptionKey)
  handle.change((doc) => {
    doc.name = USER!
    const USER_COLOR_VALUES = Object.values(USER_COLORS)
    const color = USER_COLOR_VALUES[Math.floor(Math.random() * USER_COLOR_VALUES.length)]
    doc.color = color
    doc.encryptionKey = signedEncryptionKey
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
