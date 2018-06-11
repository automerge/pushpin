import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { ipcRenderer } from 'electron'

import { USER } from '../constants'
import ContentTypes from '../content-types'
import Content from './content'
import { createDocumentLink, parseDocumentLink } from '../share-link'

const log = Debug('pushpin:workspace')

export default class Workspace extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
  }

  static initializeDocument = (workspace) => {
    // When creating a workspace we also need to create an identity and board,
    // do that first so that we have IDs.
    const identity = window.hm.create()
    const selfId = window.hm.getId(identity)
    window.hm.change(identity, (i) => {
      i.name = `The Mysterious ${USER}`
      i.docId = selfId
    })
    const boardId = Content.initializeContentDoc('board', { selfId })
    const docUrl = createDocumentLink('board', boardId)

    // Then make changes to workspace doc.
    workspace.selfId = selfId
    workspace.contactIds = []
    workspace.currentDocUrl = createDocumentLink('board', boardId)
    workspace.viewedDocUrls = [docUrl]
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.state = { sessionHistory: [], backIndex: 0 }

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

    let { sessionHistory } = this.state
    if (sessionHistory.length === 0) {
      sessionHistory = [doc.currentDocUrl]
    }

    this.setState({ ...doc, sessionHistory })
    this.refreshHeartbeat(doc)
  }

  refreshHeartbeat = (doc) => {
    const selfHandle = window.hm.openHandle(doc.selfId)
    selfHandle.message('heartbeat')
    this.timerId = setInterval(() => {
      selfHandle.message('heartbeat')
    }, 5000) // send a heartbeat every 2.5s
  }

  openDoc = (docUrl, options = {}) => {
    const { saveHistory = true } = options

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

    if (saveHistory) {
      const sessionHistory = [docUrl, ...(this.state.sessionHistory.slice(this.state.backIndex))]
      this.setState({ sessionHistory, backIndex: 0 })
    }
  }

  disableBack = () => this.state.backIndex === (this.state.sessionHistory.length - 1)

  disableForward = () => this.state.backIndex === 0

  back = () => {
    if (this.disableBack()) {
      throw new Error('Can not go back further than session history')
    }

    const backIndex = this.state.backIndex + 1
    this.setState({ backIndex }, () => {
      this.openDoc(this.state.sessionHistory[backIndex], { saveHistory: false })
    })
  }

  forward = () => {
    if (this.disableForward()) {
      throw new Error('Can not go forward past session history')
    }

    const backIndex = this.state.backIndex - 1
    this.setState({ backIndex }, () => {
      this.openDoc(this.state.sessionHistory[backIndex], { saveHistory: false })
    })
  }

  render = () => {
    log('render')
    const { type } = parseDocumentLink(this.state.currentDocUrl)
    return (
      <div className="Workspace">
        <Content
          openDoc={this.openDoc}
          url={createDocumentLink('title-bar', this.props.docId)}
          onBack={this.back}
          onForward={this.forward}
          disableBack={this.disableBack()}
          disableForward={this.disableForward()}
        />
        <div className={`Workspace__container Workspace__container--${type}`}>
          <Content url={this.state.currentDocUrl} />
        </div>
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
