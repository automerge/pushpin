import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { ipcRenderer } from 'electron'

import ContentTypes from '../../content-types'
import { createDocumentLink, parseDocumentLink } from '../../share-link'
import Content from '../content'
import TitleBar from './title-bar'


const log = Debug('pushpin:workspace')

export default class Workspace extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
  }

  static initializeDocument = (workspace) => {
    const selfId = Content.initializeContentDoc('contact')

    // this is, uh, a nasty hack.
    // we should refactor not to require the docId on the contact
    // but i don't want to pull that in scope right now
    window.hm.openHandle(selfId).change((doc) => {
      doc.docId = selfId
    })

    const boardId = Content.initializeContentDoc('board', { selfId })
    const docUrl = createDocumentLink('board', boardId)

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
      const docId = Content.initializeContentDoc('board', { selfId: this.state.selfId })
      this.openDoc(createDocumentLink('board', docId))
    })
  }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => {
    window.hm.releaseHandle(this.handle)
    clearInterval(this.timerId)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  onChange = (doc) => {
    window.selfId = doc.selfId // Be mad (:

    this.setState({ ...doc })
    this.refreshHeartbeat(doc)
  }

  refreshHeartbeat = (doc) => {
    const selfHandle = window.hm.openHandle(doc.selfId)

    if (!this.timerId) {
      selfHandle.message('heartbeat')
      this.timerId = setInterval(() => {
        selfHandle.message('heartbeat')
      }, 5000) // send a heartbeat every 5s
    }
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
      </div>)
  }

  render = () => {
    log('render')

    const content = this.renderContent(this.state.currentDocUrl)
    return (
      <div className="Workspace">
        <TitleBar docId={this.props.docId} openDoc={this.openDoc} />
        { content }
      </div>
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
