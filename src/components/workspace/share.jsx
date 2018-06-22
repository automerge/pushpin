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
    this.workspaceHandle.release()
    this.boardHandle.release()
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshWorkspaceHandle = (docId) => {
    log('refreshWorkspaceHandle')
    if (this.workspaceHandle) {
      this.workspaceHandle.release()
    }
    this.workspaceHandle = window.hm.openHandle(docId)
    this.workspaceHandle.onChange(this.onWorkspaceChange)
  }

  refreshBoardHandle = (boardId) => {
    log('refreshBoardHandle')
    if (this.boardHandle) {
      this.boardHandle.release()
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
    const noneFound = (
      <div className="ListMenu__item">
        <div className="ContactListItem">
          <i className="Badge ListMenu__thumbnail fa fa-question-circle" style={{backgroundColor: 'var(--colorPaleGrey)'}}/>
          <div className="Label">
            <p className="Type--primary">None found</p>
            <p className="Type--secondary">Copy a link to your board and start making friends</p>
          </div>
        </div>
      </div>
    )
    const contacts = uniqueContactIds.map(id => (
      <div key={id} className="ListMenu__item">
        <Content
          context="list"
          url={createDocumentLink('contact', id)}
          actions={['share']}
          onShare={e => this.offerDocumentToIdentity(e, id)}
        />
      </div>
    ))

    return (
      <div>
        <div className="ListMenu__section">
          { uniqueContactIds.length != 0 ? contacts : noneFound}
        </div>
      </div>
    )
  }

  renderAuthors = () => {
    const { authorIds = [] } = (this.state.board || {})
    const uniqueAuthorIds = authorIds.filter((id, i, a) => (a.indexOf(id) === i))
    const noneFound = (
      <div className="ListMenu__item">
        <div className="ContactListItem">
          <i className="Badge ListMenu__thumbnail fa fa-question-circle" style={{backgroundColor: 'var(--colorPaleGrey)'}}/>
          <div className="Label">
            <p className="Type--primary">None found</p>
            <p className="Type--secondary">Nobody has access to this but you</p>
          </div>
        </div>
      </div>
    )
    const authors = uniqueAuthorIds.map(id => (
      <div key={id} className="ListMenu__item">
        <Content
          key={id}
          context="list"
          url={createDocumentLink('contact', id)}
        />
      </div>
    ))
    return (
      <div>
        <div className="ListMenu__section">
          { uniqueAuthorIds.length != 0 ? authors : noneFound}
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
              <i className="fa fa-pencil" /> Authors
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
