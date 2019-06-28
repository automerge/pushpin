import ContentTypes from '../../ContentTypes'

import ContactEditor from './ContactEditor'
import ContactInVarious from './ContactInVarious'

export interface ContactDoc {
  name: string
  color: string
  avatarDocId: string
  hypermergeUrl: any //Used by workspace
  offeredUrls?: { [url: string]: string[] } // Used by share, a map of contact id to documents offered.
}

ContentTypes.register({
  type: 'contact',
  name: 'Contact',
  icon: 'sticky-note',
  resizable: true,
  unlisted: true,
  contexts: {
    workspace: ContactEditor,
    board: ContactInVarious,
    list: ContactInVarious,
    thread: ContactInVarious,
    'title-bar': ContactInVarious
  }
})
