import ContentTypes from '../../ContentTypes'
import { USER } from '../../constants'

import ContactEditor, { USER_COLORS } from './ContactEditor'
import ContactInVarious from './ContactInVarious'

import './Avatar.css'

export interface ContactDoc {
  name: string
  color: string
  avatarDocId: string
  hypermergeUrl: any //Used by workspace
  offeredUrls?: { [url: string]: string[] } // Used by share, a map of contact id to documents offered.
}

function initializeDocument(doc, typeAttrs) {
  doc.name = USER
  const USER_COLOR_VALUES = Object.values(USER_COLORS)
  const color = USER_COLOR_VALUES[Math.floor(Math.random() * USER_COLOR_VALUES.length)]
  doc.color = color
}

ContentTypes.register({
  type: 'contact',
  name: 'Contact',
  icon: 'sticky-note',
  resizable: true,
  unlisted: true,
  initializeDocument: initializeDocument,
  contexts: {
    workspace: ContactEditor,
    board: ContactInVarious,
    list: ContactInVarious,
    thread: ContactInVarious,
    'title-bar': ContactInVarious
  }
})
