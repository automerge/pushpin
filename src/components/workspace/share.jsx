import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import Content from '../content'
import { createDocumentLink, parseDocumentLink } from '../../share-link'

const log = Debug('pushpin:share')

export default class Share extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired // Workspace
  }

  state = { tab: 'authors' }

  // This is the New Boilerplate
  componentWillMount = () => {
    log('componentWillMount')
    this.refreshWorkspaceHandle(this.props.docId)
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
    window.hm.releaseHandle(this.workspaceHandle)
    window.hm.releaseHandle(this.boardHandle)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshWorkspaceHandle = (docId) => {
    log('refreshWorkspaceHandle')
    if (this.workspaceHandle) {
      window.hm.releaseHandle(this.workspaceHandle)
    }
    this.workspaceHandle = window.hm.openHandle(docId)
    this.workspaceHandle.onChange(this.onWorkspaceChange)
  }

  refreshBoardHandle = (boardId) => {
    log('refreshBoardHandle')
    if (this.boardHandle) {
      window.hm.releaseHandle(this.boardHandle)
    }

    this.boardHandle = window.hm.openHandle(boardId)
    this.boardHandle.onChange(this.onBoardChange)
  }

  onBoardChange = (doc) => {
    log('onBoardChange')
    this.updateIdentityReferences(this.workspaceHandle, this.boardHandle)
    this.setState({ board: doc })
  }

  onWorkspaceChange = (doc) => {
    log('onWorkspaceChange')
    this.setState({ workspace: doc }, () => {
      if (this.state.workspace.currentDocUrl) {
        const { docId } = parseDocumentLink(this.state.workspace.currentDocUrl)

        if (!this.state.board || this.state.board.docId !== docId) {
          this.refreshBoardHandle(docId)
        }
      }
    })
  }

  updateIdentityReferences = (workspaceHandle, boardHandle) => {
    log('updateIdentityReferences')
    const { authorIds } = boardHandle.get() || {}
    // If there is no authorIds yet, we've just loaded a uninitialized board. We'll
    // shortly get an onChange callback with the initialized board, so don't try to
    // do anything before then. Without this guard, the boardHandle.change block is
    // liable to throw cryptic errors.
    if (authorIds) {
      const { selfId, contactIds = [] } = workspaceHandle.get() || {}

      // Add any never-before seen authors to our contacts.
      const newContactIds = authorIds.filter((a) => !contactIds.includes(a) && !(selfId === a))
      if (newContactIds.length > 0) {
        workspaceHandle.change((workspace) => {
          workspace.contactIds.push(...newContactIds)
        })
      }

      // Add ourselves to the authors if we haven't yet.
      if (selfId && !authorIds.includes(selfId)) {
        log('updateIdentityReferences.addSelf')
        boardHandle.change((board) => {
          if (!board.authorIds) {
            board.authorIds = []
          }
          board.authorIds.push(selfId)
        })
      }
    }
  }

  offerDocumentToIdentity = (e, contactId) => {
    if (!this.state.workspace.selfId) {
      return
    }

    log('offerDocumentToIdentity')

    const selfHandle = window.hm.openHandle(this.state.workspace.selfId)

    selfHandle.change((s) => {
      if (!s.offeredUrls) {
        s.offeredUrls = {}
      }

      if (!s.offeredUrls[contactId]) {
        s.offeredUrls[contactId] = []
      }

      if (!s.offeredUrls[contactId].includes(this.state.workspace.currentDocUrl)) {
        s.offeredUrls[contactId].push(this.state.workspace.currentDocUrl)
      }
    })
  }

  renderContacts = () => {
    const { contactIds = [] } = (this.state.workspace || {})
    const uniqueContactIds = contactIds.filter((id, i, a) => (a.indexOf(id) === i))

    const contacts = uniqueContactIds.map(id => (
      <Content
        key={id}
        context="list"
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
    const { authorIds = [] } = (this.state.board || {})
    const uniqueAuthorIds = authorIds.filter((id, i, a) => (a.indexOf(id) === i))

    const authors = uniqueAuthorIds.map(id => (
      <Content
        key={id}
        context="list"
        url={createDocumentLink('contact', id)}
      />
    ))

    return (
      <div>
        <div className="ListMenu__segment">On Board</div>
        <div className="ListMenu__section">
          { authors }
        </div>
      </div>
    )
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
