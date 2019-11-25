import { Handle, Crypto } from 'hypermerge'
import * as ContentTypes from '../../../ContentTypes'
import { USER } from '../../../constants'
import { HypermergeUrl } from '../../../ShareLink'

import ContactWorkspace from './ContactWorkspace'
import ContactInVarious from './ContactInVarious'
import { USER_COLORS } from './ContactEditor'

import './Avatar.css'

export type ContactDocInvites = { [url: string]: Crypto.Box[] }
export interface ContactDoc {
  name: string
  color: string
  avatarDocId: HypermergeUrl
  hypermergeUrl: HypermergeUrl // Used by workspace
  invites: ContactDocInvites
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
    workspace: ContactWorkspace,
    board: ContactInVarious,
    list: ContactInVarious,
    thread: ContactInVarious,
    'title-bar': ContactInVarious,
  },
})
