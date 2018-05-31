import React from 'react'
import PropTypes from 'prop-types'

import Content from './content'
import ContentTypes from '../content-types'

export default class Share extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      selfId: PropTypes.string,
      boardId: PropTypes.string,
      authorIds: PropTypes.arrayOf(PropTypes.string),
      contactIds: PropTypes.arrayOf(PropTypes.string),
      notifications: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string.isRequired,
        sender: PropTypes.object.isRequired,
        board: PropTypes.object.isRequired
      }))
    }).isRequired,
    openBoard: PropTypes.func.isRequired
  }

  constructor() {
    super()

    this.state = { requestedContactDocs: {}, contactDocs: {}, tab: 'notifications' }
  }

  getHypermergeDoc(docId, cb) {
    window.hm.open(docId)
      .then(doc => {
        // XXX fixme: lol
        window.hm.on('document:updated', (id, doc) => {
          if (id !== docId) {
            return
          }

          // unregister listener
          cb(null, doc)
        })
        cb(null, doc)
      }, err => {
        cb(err)
      })
  }

  updateIdentityReferences(workspaceDoc, boardDoc) {
    const { authorIds = [] } = boardDoc
    const { selfId, contactIds = [] } = workspaceDoc


    // add any never-before seen authors to our contacts
    const newContactIds = authorIds.filter((a) => !contactIds.includes(a) && !(selfId === a))
    if (newContactIds.length > 0) {
      window.hm.change(workspaceDoc, (workspace) => {
        workspace.contactIds.push(...newContactIds)
      })
    }

    // add ourselves to the authors if we haven't yet
    // note that we guard against an empty authorIds
    if (selfId && boardDoc.authorIds && !authorIds.includes(selfId)) {
      // XXX JANK -- get rid of all these window.hm calls
      window.hm.change(boardDoc, (board) => {
        board.authorIds.push(selfId)
      })
    }
  }

  openBoardDocument() {
    if (this.props.doc.boardId && this.props.doc.boardId !== this.state.boardId) {
      this.getHypermergeDoc(this.props.doc.boardId, (err, doc) => {
        this.updateIdentityReferences(this.props.doc, doc)
        this.setState({ boardId: this.props.doc.boardId, boardDoc: doc })
      })
    }
  }

  openAllContacts() {
    const { contactIds } = this.props.doc
    const { requestedContactDocs } = this.state
    if (contactIds) {
      contactIds.forEach((contactId) => {
        if (!requestedContactDocs[contactId]) {
          requestedContactDocs[contactId] = true

          this.getHypermergeDoc(contactId, (err, doc) =>
            // updates will result in an updated contact document
            this.setState({ ...this.state,
              contactDocs: { ...this.state.contactDocs, [contactId]: doc } }))
        }
      })
      // the dance with requestedContactDocs prevents requesting the same one multiple times
      this.setState({ ...this.state, requestedContactDocs })
    }
  }

  openSelfDocument() {
    if (this.props.doc.selfId && this.props.doc.selfId !== this.state.selfId) {
      this.getHypermergeDoc(this.props.doc.selfId, (err, doc) => {
        this.setState({ selfId: this.props.doc.selfId, selfDoc: doc })
      })
    }
  }

  // XXX will this work right as the document changes?
  componentDidUpdate() {
    this.openBoardDocument()
    this.openAllContacts()
    this.openSelfDocument()
  }

  // this probably doesn't work here...
  offerDocumentToIdentity(e, contactId) {
    if (!this.state.selfDoc) {
      throw new Error('unable to write an offer without a self identity to hold it')
    }
    window.hm.change(this.state.selfDoc, (s) => {
      if (!s.offeredIds) {
        s.offeredIds = {}
      }

      if (!s.offeredIds[contactId]) {
        s.offeredIds[contactId] = []
      }

      if (!s.offeredIds[contactId].includes(this.props.doc.boardId)) {
        s.offeredIds[contactId].push(this.props.doc.boardId)
      }
    })
  }

  renderContacts() {
    const authorIds = this.state.boardDoc && this.state.boardDoc.authorIds || []

    const authors = authorIds.map(id => (
      <Content
        key={id}
        type="contact"
        docId={id}
      />
    ))

    const contactIds = this.props.doc.contactIds || []

    // this .filter is probably very slow if you have a lot of authors
    const filteredContactIds = contactIds.filter(contactId => (!authorIds.includes(contactId)))

    const contacts = filteredContactIds.map(id => (
      <Content
        key={id}
        type="contact"
        docId={id}
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
    this.props.openBoard(notification.board.docId)
  }

  renderNotifications() {
    const consolidatedOffers = []

    Object.entries(this.state.contactDocs).forEach(([contactId, contact]) => {
      if (contact.offeredIds && contact.offeredIds[this.props.doc.selfId]) {
        const offeredIds = contact.offeredIds[this.props.doc.selfId]
        offeredIds.forEach((offeredId) => {
          consolidatedOffers.push({ offeredId, offererDoc: contact })
        })
      }
    })

    // consider filtering out known boards

    const notifications = []
    consolidatedOffers.forEach(offer => {
      const contactDoc = offer.offererDoc

      const board = { title: offer.offeredId, docId: offer.offeredId }
      notifications.push({ type: 'Invitation', sender: contactDoc, board })
    })

    const notificationsJSX = notifications.map(notification => (
      // we should create a more unique key; do we want to allow the same share multiple times?
      // i'm going to block it on the send side for now
      <div key={`${notification.sender.name}-${notification.board.title}`} className="ListMenu__item">
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
    if (this.state.tab === 'contacts') { body = this.renderContacts() } else if (this.state.tab === 'notifications') { body = this.renderNotifications() }

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
