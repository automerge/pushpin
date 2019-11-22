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

function create(_typeAttrs, handle: Handle<ContactDoc>) {
  handle.change((doc) => {
    doc.name = USER!
    const USER_COLOR_VALUES = Object.values(USER_COLORS)
    const color = USER_COLOR_VALUES[Math.floor(Math.random() * USER_COLOR_VALUES.length)]
    doc.color = color
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
