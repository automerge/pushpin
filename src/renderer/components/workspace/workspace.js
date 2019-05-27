import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { ipcRenderer } from 'electron'

import ContentTypes from '../../content-types'
import { createDocumentLink, parseDocumentLink } from '../../share-link'
import Content from '../content'
import SelfContext from '../self-context'
import TitleBar from './title-bar'
import Board from '../board/board'

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
    // eslint-disable-next-line react/no-render-return-value
    const theBoard = ReactDOM.render(<Board hypermergeUrl={boardId} />, document.createElement('div'))
    theBoard.createCard({ x: 20,
      y: 20,
      type: 'text',
      typeAttrs: { text } })

    // Then make changes to workspace doc.
    workspace.selfId = selfId
    workspace.contactIds = []
    workspace.currentDocUrl = createDocumentLink('board', boardId)
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
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }

  onChange = (doc) => {
    this.setState({ ...doc })
    this.refreshHeartbeat(doc)
  }

  refreshHeartbeat = (doc) => {
    /*    const selfHandle = window.repo.watch(doc.selfId)

    if (!this.timerId) {
      selfHandle.message('heartbeat')
      this.timerId = setInterval(() => {
        selfHandle.message('heartbeat')
      }, 5000) // send a heartbeat every 5s
    } */ // no onMessage support in this HM
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
          { content }
        </div>
      </SelfContext.Provider>
    )
  }
}

ContentTypes.register({
  component: Workspace,
  type: 'workspace',
  name: 'Workspace',
  icon: 'briefcase',
  resizable: false,
  unlisted: true
})
