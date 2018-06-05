import React from 'react'
import PropTypes from 'prop-types'

import Content from './content'
import ContentTypes from '../content-types'
import { shareLinkForDocument, parseDocumentLink } from '../share-link'

export default class Share extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    doc: PropTypes.shape({
      selfId: PropTypes.string,
      currentDocUrl: PropTypes.string,
      authorIds: PropTypes.arrayOf(PropTypes.string),
      contactIds: PropTypes.arrayOf(PropTypes.string),
      notifications: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string.isRequired,
        sender: PropTypes.object.isRequired,
        board: PropTypes.object.isRequired
      }))
    }).isRequired,
    openDocument: PropTypes.func.isRequired
  }

  constructor() {
    super()

    this.state = {
      consolidatedOffers: [],
      tab: 'notifications'
    }
  }

  updateIdentityReferences(workspaceHandle, boardHandle) {
    const { authorIds = [] } = boardHandle.get() || {}
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
      boardHandle.change((board) => {
        board.authorIds.push(selfId)
      })
    }
  }

  watchBoard() {
    // we need to create a new current document handle each time the document changes
    // NB: this is probably leaking listeners right now
    if (this.props.doc.currentDocUrl && this.props.doc.currentDocUrl !== this.state.currentDocUrl) {
      const workspaceHandle = window.hm.openHandle(this.props.docId)
      const { docId: currentDocId } = parseDocumentLink(this.props.doc.currentDocUrl)
      const currentDocHandle = window.hm.openHandle(currentDocId)
      currentDocHandle.onChange((doc) => {
        this.updateIdentityReferences(workspaceHandle, currentDocHandle)
        this.setState({ currentDocUrl: this.props.doc.currentDocUrl })
      })
    }
  }

  onContactUpdated(contactId, contact) {
    const { selfId } = this.props.doc
    const { consolidatedOffers } = this.state

    // record offers of boards for this account from this contact in our local state
    if (!contact.offeredIds) {
      return
    }

    const offererId = contactId
    const offersForUs = contact.offeredIds[selfId] || []
    offersForUs.forEach((offeredId) => {
      // add this to the offers if we haven't already got it
      if (!consolidatedOffers.some((offer) =>
        (offer.offeredId === offeredId && offer.offererId === offererId))) {
        consolidatedOffers.push({ offeredId, offererId })
      }
    })

    this.setState({ consolidatedOffers })
  }

  watchContacts() {
    const { contactIds = [] } = this.props.doc
    const { watchedContacts = {} } = this.state

    contactIds.forEach((contactId) => {
      if (!watchedContacts[contactId]) {
        watchedContacts[contactId] = window.hm.openHandle(contactId).onChange((doc) => {
          this.onContactUpdated(contactId, doc)
        })
      }
    })
  }

  // XXX will this work right as the document changes?
  componentDidUpdate() {
    this.watchBoard()
    this.watchContacts()
  }

  offerDocumentToIdentity(e, contactId) {
    if (!this.props.doc.selfId) {
      return
    }

    const selfHandle = window.hm.openHandle(this.props.doc.selfId)

    selfHandle.change((s) => {
      if (!s.offeredIds) {
        s.offeredIds = {}
      }

      if (!s.offeredIds[contactId]) {
        s.offeredIds[contactId] = []
      }

      if (!s.offeredIds[contactId].includes(this.props.doc.currentDocUrl)) {
        s.offeredIds[contactId].push(this.props.doc.currentDocUrl)
      }
    })
  }

  renderContacts() {
    const { currentDocUrl, contactIds = [] } = this.props.doc
    if (!currentDocUrl) {
      return null
    }

    const { type, docId } = parseDocumentLink(this.props.doc.currentDocUrl)
    if (type !== 'board') {
      // right now only boards have authorIds (though maybe we can check that instead?)
      return null
    }

    const boardHandle = window.hm.openHandle(docId)
    const { authorIds = [] } = boardHandle.get() || {}

    const authors = authorIds.map(id => (
      <Content
        key={id}
        url={shareLinkForDocument('contact', id)}
      />
    ))

    // this .filter is probably very slow if you have a lot of authors
    const nonAuthorContactIds = contactIds.filter(contactId => (!authorIds.includes(contactId)))
    const contacts = nonAuthorContactIds.map(id => (
      <Content
        key={id}
        url={shareLinkForDocument('contact', id)}
        actions={['share']}
        onShare={e => this.offerDocumentToIdentity(e, id)}
      />
    ))

    return (
      <div>
        <div className="ListMenu__segment">On Board</div>
        <div className="ListMenu__section">
          { authors }
        </div>
        { (contacts.length > 0) && <div className="ListMenu__segment">All</div> }
        <div className="ListMenu__section">
          { contacts }
        </div>
      </div>
    )
  }

  acceptNotification(notification) {
    this.props.openDocument(notification.documentUrl)
  }

  renderNotifications() {
    const notifications = []
    this.state.consolidatedOffers.forEach(offer => {
      const sender = window.hm.openHandle(offer.offererId).get()
      const board = window.hm.openHandle(offer.offeredId).get()
      if (sender && board) {
        notifications.push({ type: 'Invitation', sender, board })
      }
    })

    const notificationsJSX = notifications.map(notification => (
      // we should create a more unique key; do we want to allow the same share multiple times?
      // i'm going to block it on the send side for now
      <div key={`${notification.sender.docId}-${notification.documentUrl}`} className="ListMenu__item">
        <div className="ListMenu__grouped">
          <div className="ListMenu__typegroup">
            <h4 className="Type--primary">{ notification.board.title }</h4>
            <p className="Type--secondary">From { notification.sender.name }</p>
          </div>
          <div className="ButtonGroup">
            <div
              role="button"
              className="ButtonAction ButtonAction--primary"
              onClick={e => this.acceptNotification(notification)}
            >
              <i className="fa fa-arrow-right" />
              <p className="ButtonAction__label">View</p>
            </div>
            <div
              role="button"
              className="ButtonAction ButtonAction--destructive"
              onClick={e => alert(`Archive ${notification.board.title}`)}
            >
              <i className="fa fa-archive" />
              <p className="ButtonAction__label">Archive</p>
            </div>
          </div>
        </div>
      </div>
    ))

    return (
      <div className="ListMenu__section">
        { notificationsJSX.length > 0 ? notificationsJSX :
        <div className="ListMenu__item">
          <div className="ListMenu__grouped">
            <div className="ListMenu__typegroup">
              <i className="fa fa-info-circle" />
              <p className="Type--primary">
                Nothing here!.
              </p>
              <p className="Type--secondary">
                Documents are like love. You have got to give
                a little to get a little.
              </p>
            </div>
          </div>
        </div>
        }
      </div>
    )
  }

  tabClasses(name) {
    if (this.state.tab === name) { return 'Tabs__tab Tabs__tab--active' }
    return 'Tabs__tab'
  }

  render() {
    let body

    // XXX if notifications is empty, let's default to contacts.
    // NB: i have not implemented this, i'm just leaving a note to myself
    if (this.state.tab === 'contacts') {
      body = this.renderContacts()
    } else if (this.state.tab === 'notifications') {
      body = this.renderNotifications()
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
              <i className="fa fa-group" /> Contacts
            </div>
            <div
              role="button"
              className={this.tabClasses('notifications')}
              onClick={() => this.setState({ tab: 'notifications' })}
            >
              Notifications
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
