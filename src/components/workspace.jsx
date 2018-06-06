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
    doc: PropTypes.shape({
      selfId: PropTypes.string.isRequired,
      currentDocUrl: PropTypes.string.isRequired,
      contactIds: PropTypes.arrayOf(PropTypes.string).isRequired
    }).isRequired,
    onChange: PropTypes.func.isRequired
  }

  static initializeDocument(workspace) {
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

  constructor() {
    log('constructor')
    super()
    this.openDoc = this.openDoc.bind(this)

    ipcRenderer.on('loadDocumentUrl', (url) => {
      this.openDoc(url)
    })

    ipcRenderer.on('newDocument', () => {
      const docId = Content.initializeContentDoc('board', { selfId: this.props.doc.selfId })
      this.openDoc(createDocumentLink('board', docId))
    })
  }

  openDoc(docUrl, options = {}) {
    const { saveHistory = true } = options

    try {
      parseDocumentLink(docUrl)
    } catch (e) {
      // if we can't parse the document, don't navigate
      return
    }

    this.props.onChange((ws) => {
      ws.currentDocUrl = docUrl

      if (saveHistory) {
        ws.viewedDocUrls = ws.viewedDocUrls.filter(url => url !== docUrl)
        ws.viewedDocUrls.unshift(docUrl)
      }
    })
  }

  render() {
    log('render')
    return (
      <div className="Workspace">
        <Content openDoc={this.openDoc} url={createDocumentLink('title-bar', this.props.docId)} />
        <div className="Workspace__container">
          <Content url={this.props.doc.currentDocUrl} />
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
