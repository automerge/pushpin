import ContentTypes from '../../content-types'

import ContactEditor from './ContactEditor'
import ContactInBoard from './ContactInBoard'
import ContactInTitleBar from './ContactInTitleBar'
import ContactInList from './ContactInList'
import ContactInThread from './ContactInThread'

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
    board: ContactInBoard,
    list: ContactInList,
    thread: ContactInThread,
    'title-bar': ContactInTitleBar }
})
