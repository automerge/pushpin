import React from 'react'
import PropTypes from 'prop-types'

import Content from './content'
import ContentTypes from '../content-types'
import { createDocumentLink, parseDocumentLink } from '../share-link'

export default class Share extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    openDocument: PropTypes.func.isRequired
  }

  state = { tab: 'authors' }

  updateIdentityReferences = (workspaceHandle, documentHandle) => {
    const { authorIds = [] } = documentHandle.get() || {}
    const { selfId, contactIds = [] } = workspaceHandle.get() || {}

    // add any never-before seen authors to our contacts
    const newContactIds = authorIds.filter((a) => !contactIds.includes(a) && !(selfId === a))
    if (newContactIds.length > 0) {
      workspaceHandle.change((workspace) => {
        workspace.contactIds.push(...newContactIds)
      })
    }

    // add ourselves to the authors if we haven't yet
    if (selfId && !authorIds.includes(selfId)) {
      documentHandle.change((document) => {
        if (!document.authorIds) {
          document.authorIds = []
        }
        document.authorIds.push(selfId)
      })
    }
  }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => window.hm.releaseHandle(this.handle)

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshBoardHandle = (boardId) => {
    if (this.boardHandle) {
      window.hm.releaseHandle(this.boardHandle)
    }

    this.boardHandle = window.hm.openHandle(boardId)
    this.boardHandle.onChange((doc) => {
      this.updateIdentityReferences(this.handle, this.boardHandle)
      this.setState({ board: doc })
    })
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  onChange = (doc) => {
    this.setState({ doc }, () => {
      if (this.state.doc.currentDocUrl) {
        const { docId } = parseDocumentLink(this.state.doc.currentDocUrl)

        if (!this.state.board || this.state.board.docId !== docId) {
          this.refreshBoardHandle(docId)
        }
      }
    })
  }

  offerDocumentToIdentity = (e, contactId) => {
    if (!this.state.doc.selfId) {
      return
    }

    const selfHandle = window.hm.openHandle(this.state.doc.selfId)

    selfHandle.change((s) => {
      if (!s.offeredUrls) {
        s.offeredUrls = {}
      }

      if (!s.offeredUrls[contactId]) {
        s.offeredUrls[contactId] = []
      }

      if (!s.offeredUrls[contactId].includes(this.state.doc.currentDocUrl)) {
        s.offeredUrls[contactId].push(this.state.doc.currentDocUrl)
      }
    })
  }

  renderContacts = () => {
    const { currentDocUrl, contactIds = [] } = this.state.doc || {}

    const contacts = contactIds.map(id => (
      <Content
        key={id}
        url={createDocumentLink('contact', id)}
        actions={['share']}
        onShare={e => this.offerDocumentToIdentity(e, id)}
      />
    ))

    return (
      <div>
        <div className="ListMenu__segment">All Contacts</div>
        <div className="ListMenu__section">
          { contacts }
        </div>
      </div>
    )
  }

  renderAuthors = () => {
    const authorIds = this.state.board ? this.state.board.authorIds : []

    const authors = authorIds.map(id => (
      <Content
        key={id}
        url={createDocumentLink('contact', id)}
      />
    ))

    return <div>
      <div className="ListMenu__segment">On Board</div>
      <div className="ListMenu__section">
        { authors }
      </div>
    </div>
  }

  tabClasses = (name) => {
    if (this.state.tab === name) { return 'Tabs__tab Tabs__tab--active' }
    return 'Tabs__tab'
  }

  render = () => {
    let body

    // XXX if notifications is empty, let's default to contacts.
    // NB: i have not implemented this, i'm just leaving a note to myself
    if (this.state.tab === 'contacts') {
      body = this.renderContacts()
    } else if (this.state.tab === 'authors') {
      body = this.renderAuthors()
    }

    return (
      <div className="PopOverWrapper">
        <div className="ListMenu">
          <div className="Tabs">
            <div
              role="button"
              className={this.tabClasses('authors')}
              onClick={() => this.setState({ tab: 'authors' })}
            >
              <i className="fa fa-copy" /> On Board
            </div>
            <div
              role="button"
              className={this.tabClasses('contacts')}
              onClick={() => this.setState({ tab: 'contacts' })}
            >
              <i className="fa fa-group" /> All Contacts
            </div>
          </div>
          { body }
        </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: Share,
  type: 'share',
  name: 'Share',
  icon: 'sticky-note',
  unlisted: 'true',
})
