import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { ipcRenderer } from 'electron'
import uuid from 'uuid'

import ContentTypes from '../../content-types'
import { createDocumentLink, parseDocumentLink } from '../../share-link'
import Content from '../content'
import SelfContext from '../self-context'
import TitleBar from './title-bar'

const log = Debug('pushpin:workspace')

export default class Workspace extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired,
  }

  static initializeDocument = (workspace) => {
    const selfId = Content.initializeContentDoc('contact')

    // this is, uh, a nasty hack.
    // we should refactor not to require the hypermergeUrl on the contact
    // but i don't want to pull that in scope right now
    window.repo.change(selfId, (doc) => {
      doc.hypermergeUrl = selfId
    })

    const boardId = Content.initializeContentDoc('board', { title: 'Welcome to PushPin!', selfId })
    const docUrl = createDocumentLink('board', boardId)

    const text = `Welcome to PushPin!

We've created your first text card for you.
You can edit it, or make more by double-clicking the background.

You can drag or paste images, text, and URLs onto the board. They'll be stored for offline usage.
If you right-click, you can choose the kind of card to make.
You can make new boards from the right-click menu or with Ctrl-N.

To edit the title of a board, click the pencil.
To share a board with another person, click the clipboard, then have them paste that value into the omnibox.

Quick travel around by clicking the Omnibox. Typing part of a name will show you people and boards that match that. The omnibox can also be opened with '/'.

To create links to boards or contacts, drag them from the title bar or the omnibox.`

    const textDocId = Content.initializeContentDoc('text', { text })
    const textDocUrl = createDocumentLink('text', textDocId)

    const id = uuid()
    window.repo.change(boardId, doc => {
      doc.cards[id] = {
        id,
        url: textDocUrl,
        x: 20,
        y: 20,
        width: 320,
        height: 540
      }
    })

    // Then make changes to workspace doc.
    workspace.selfId = selfId
    workspace.contactIds = []
    workspace.currentDocUrl = docUrl
    workspace.viewedDocUrls = [docUrl]
  }

  state = {}

  constructor(props) {
    super(props)
    log('constructor')

    ipcRenderer.on('loadDocumentUrl', (event, url) => {
      this.openDoc(url)
    })

    ipcRenderer.on('newDocument', () => {
      const hypermergeUrl = Content.initializeContentDoc('board', { selfId: this.state.selfId })
      this.openDoc(createDocumentLink('board', hypermergeUrl))
    })
  }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.hypermergeUrl)
  componentWillUnmount = () => {
    this.handle.close()
    if (this.state.selfId) {
      this.heartbeatNotifyDeparture(this.state.selfId)
    }
    clearInterval(this.timerId)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.open(hypermergeUrl)
    this.handle.subscribe((doc) => this.onChange(doc))
  }

  onChange = (doc) => {
    this.setState({ ...doc })
    this.refreshSelfHeartbeat(doc)
    this.refreshCurrentDocHandle(doc)
  }

  // The workspace takes on two responsibilities around presence.
  // First, it posts on the self-contact ID that we're online.
  // This means any avatar anywhere will have a colored ring around it
  // if that user is online.
  refreshSelfHeartbeat = (doc) => {
    const selfHandle = window.repo.open(doc.selfId)

    if (!this.selfTimerId) {
      selfHandle.message('heartbeat')
      this.selfTimerId = setInterval(() => {
        selfHandle.message('heartbeat')
      }, 1000) // send a heartbeat every 5s
    }
  }

  // Second, it posts a presence heartbeat on the document currently
  // considered to be open, allowing any kind of card to render a list of
  // "present" folks.
  // Any time the document changes, we throw away the old handle and
  // make a new one for the new document.
  // NB: The current implementation doesn't have any caching of messages,
  //     so "present" avatars will have to wait for a second heartbeat to arrive
  //     before appearing present since the first one will have passed in causing
  //     them to render...
  refreshCurrentDocHandle = ({ selfId, currentDocUrl }) => {
    if (this.currentDocHandle) {
      this.currentDocHandle.close()
      this.heartbeatNotifyDeparture(selfId)
    }
    const { hypermergeUrl } = parseDocumentLink(currentDocUrl)
    this.currentDocHandle = window.repo.open(hypermergeUrl)

    if (!this.currentDocTimerId) {
      this.currentDocHandle.message({ contact: selfId, heartbeat: true })
      this.currentDocTimerId = setInterval(() => {
        this.currentDocHandle.message({ contact: selfId, heartbeat: true })
      }, 1000) // send a heartbeat every 5s
    }
  }

  heartbeatNotifyDeparture = (selfId) => {
    // notify peers on the current board that we're departing
    this.currentDocHandle.message({ contact: selfId, departing: true })
  }

  openDoc = (docUrl) => {
    try {
      parseDocumentLink(docUrl)
    } catch (e) {
      // if we can't parse the document, don't navigate
      return
    }

    this.handle.change((ws) => {
      ws.currentDocUrl = docUrl

      ws.viewedDocUrls = ws.viewedDocUrls.filter(url => url !== docUrl)
      ws.viewedDocUrls.unshift(docUrl)

      if (ws.archivedDocUrls) {
        ws.archivedDocUrls = ws.archivedDocUrls.filter(url => url !== docUrl)
      }
    })
  }

  renderContent = (currentDocUrl) => {
    if (!currentDocUrl) {
      return null
    }

    const { type } = parseDocumentLink(currentDocUrl)
    return (
      <div className={`Workspace__container Workspace__container--${type}`}>
        <Content context="workspace" url={this.state.currentDocUrl} />
      </div>
    )
  }

  render = () => {
    log('render')

    const content = this.renderContent(this.state.currentDocUrl)
    return (
      <SelfContext.Provider value={this.state.selfId}>
        <div className="Workspace">
          <TitleBar hypermergeUrl={this.props.hypermergeUrl} openDoc={this.openDoc} />
          {content}
        </div>
      </SelfContext.Provider>
    )
  }
}

ContentTypes.register({
  type: 'workspace',
  name: 'Workspace',
  icon: 'briefcase',
  contexts: { workspace: Workspace },
  resizable: false,
  unlisted: true
})
