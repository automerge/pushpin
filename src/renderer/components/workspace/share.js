import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import ContactEditor from '../contact/ContactEditor'

import { createDocumentLink, parseDocumentLink } from '../../ShareLink'
import ListMenuItem from './list-menu-item'

const log = Debug('pushpin:share')

export default class Share extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired // Workspace
  }

  state = { tab: 'contacts' }

  // This is the New Boilerplate
  componentWillMount = () => {
    log('componentWillMount')
    this.refreshWorkspaceHandle(this.props.hypermergeUrl)
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
    this.workspaceHandle.close()
    this.boardHandle.close()
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshWorkspaceHandle = (hypermergeUrl) => {
    log('refreshWorkspaceHandle')
    if (this.workspaceHandle) {
      this.workspaceHandle.close()
    }
    this.workspaceHandle = window.repo.watch(hypermergeUrl, (doc) => this.onWorkspaceChange(doc))
  }

  refreshBoardHandle = (boardId) => {
    log('refreshBoardHandle')
    if (this.boardHandle) {
      this.boardHandle.close()
    }
    this.boardHandle = window.repo.watch(boardId, (doc) => this.onBoardChange(doc))
  }

  onBoardChange = (doc) => {
    log('onBoardChange')
    this.setState({ board: doc })
  }

  onWorkspaceChange = (doc) => {
    log('onWorkspaceChange')
    this.setState({ workspace: doc }, () => {
      if (this.state.workspace.currentDocUrl) {
        const { hypermergeUrl } = parseDocumentLink(this.state.workspace.currentDocUrl)

        if (!this.state.board || this.state.board.hypermergeUrl !== hypermergeUrl) {
          this.refreshBoardHandle(hypermergeUrl)
        }
      }
    })
  }

  offerDocumentToIdentity = (e, contactId) => {
    if (!this.state.workspace.selfId) {
      return
    }

    log('offerDocumentToIdentity')

    window.repo.change(this.state.workspace.selfId, (s) => {
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
        <div className="ContactListMenuItem">
          <i className="Badge ListMenu__thumbnail fa fa-question-circle" style={{ backgroundColor: 'var(--colorPaleGrey)' }} />
          <div className="Label">
            <p className="Type--primary">None found</p>
            <p className="Type--secondary">Copy a link to your board and start making friends</p>
          </div>
        </div>
      </div>
    )

    const share = {
      name: 'share',
      callback: (url) => (e) => this.offerDocumentToIdentity(url),
      faIcon: 'fa-share-alt',
      label: 'Share'
    }

    /* This doesn't make sense in a Pushpin world, I think.
       Once you've written a share offer into your history,
       anyone could go back and find it again.
       I'll leave it here for posterity for now.
    const unshare = {
      name: 'unshare',
      destructive: true,
      callback: (url) => (e) => this.revokeOfferDocumentToIdentity(url),
      faIcon: 'fa-ban',
      label: 'Unshare'
    }
    */

    const contacts = uniqueContactIds.map(id => (
      <ListMenuItem key={id} contentUrl={createDocumentLink('contact', id)} actions={[share]} />
    ))

    return (
      <div>
        <div className="ListMenu__section">
          {uniqueContactIds.length !== 0 ? contacts : noneFound}
        </div>
      </div>
    )
  }


  renderProfile = () => (

    <ContactEditor hypermergeUrl={this.state.workspace.selfId} />
  )

  tabClasses = (name) => {
    if (this.state.tab === name) { return 'Tabs__tab Tabs__tab--active' }
    return 'Tabs__tab'
  }

  render = () => {
    let body
    if (this.state.tab === 'profile') {
      body = this.renderProfile()
    } else if (this.state.tab === 'contacts') {
      body = this.renderContacts()
    }

    return (
      <div className="PopOverWrapper">
        <div className="ListMenu">
          <div className="Tabs">
            <div
              role="button"
              className={this.tabClasses('contacts')}
              onClick={() => this.setState({ tab: 'contacts' })}
            >
              <i className="fa fa-group" /> All Contacts
            </div>
            <div
              role="button"
              className={this.tabClasses('profile')}
              onClick={() => this.setState({ tab: 'profile' })}
            >
              <i className="fa fa-pencil" /> Profile
            </div>
          </div>
          {body}
        </div>
      </div>
    )
  }
}
