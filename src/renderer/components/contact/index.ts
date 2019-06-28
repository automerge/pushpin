import ContentTypes from '../../content-types'

import ContactEditor from './ContactEditor'
import ContactInVarious from './ContactInVarious'

export interface ContactDoc {
  name: string
  color: string
  avatarDocId: string
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
    'title-bar': ContactInVarious }
})
