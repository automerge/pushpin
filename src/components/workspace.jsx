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

  static initializeDocument(onChange) {
    const identity = window.hm.create()
    const selfId = window.hm.getId(identity)
    window.hm.change(identity, (i) => {
      i.name = `The Mysterious ${USER}`
      i.docId = selfId
    })

    const boardId = Content.initializeContentDoc('board', { selfId })

    onChange((ws) => {
      ws.selfId = selfId
      ws.currentDocUrl = createDocumentLink('board', boardId)
      ws.contactIds = []
      ws.viewedDocIds = [boardId]
    })
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

  openDoc(docUrl) {
    try {
      parseDocumentLink(docUrl)
    } catch (e) {
      // if we can't parse the document, don't navigate
      return
    }
    this.props.onChange((ws) => {
      ws.currentDocUrl = docUrl

      ws.viewedDocIds = ws.viewedDocIds.filter(url => url !== docUrl)
      ws.viewedDocIds.push(docUrl)
    })
  }

  render() {
    log('render')
    return (
      <div className="Workspace">
        <Content url={createDocumentLink('title-bar', this.props.docId)} />
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
  unlisted: true,
})
