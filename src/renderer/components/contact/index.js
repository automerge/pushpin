import ContentTypes from '../../content-types'

import ContactEditor from './contact-editor'
import ContactInBoard from './contact-in-board'
import ContactInTitleBar from './contact-in-title-bar'
import ContactInList from './contact-in-list'
import ContactInThread from './contact-in-thread'

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
