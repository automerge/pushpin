import ContentTypes from '../../ContentTypes'
import { USER } from '../../constants'
import { HypermergeUrl, PushpinUrl, createDocumentLink } from '../../ShareLink'

import ContactEditor, { USER_COLORS } from './ContactEditor'
import ContactInVarious from './ContactInVarious'

import './Avatar.css'

export interface ContactDoc {
  name: string
  color: string
  avatarDocId: HypermergeUrl
  hypermergeUrl: HypermergeUrl // Used by workspace
  offeredUrls?: { [url: string]: PushpinUrl[] } // Used by share, a map of contact id to documents offered.
}

function initializeContent(typeAttrs, handle, callback) {
  handle.change((doc) => {
    doc.name = USER
    const USER_COLOR_VALUES = Object.values(USER_COLORS)
    const color = USER_COLOR_VALUES[Math.floor(Math.random() * USER_COLOR_VALUES.length)]
    doc.color = color
  })
  callback(createDocumentLink('contact', `hypermerge:/${handle.id}` as HypermergeUrl))
}

ContentTypes.register({
  type: 'contact',
  name: 'Contact',
  icon: 'sticky-note',
  resizable: true,
  unlisted: true,
  initializeContent,
  contexts: {
    workspace: ContactEditor,
    board: ContactInVarious,
    list: ContactInVarious,
    thread: ContactInVarious,
    'title-bar': ContactInVarious,
  },
})
