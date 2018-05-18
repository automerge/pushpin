import React from 'react'
import PropTypes from 'prop-types'

import Contact from './contact'
import Loop from '../loop'
import * as Model from '../model'

export default class Share extends React.PureComponent {
  static propTypes = {
    authors: PropTypes.objectOf(PropTypes.shape({
      docId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string.isOptional
    })),
    board: PropTypes.shape({
      docId: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    }).isRequired,
    contacts: PropTypes.objectOf(PropTypes.shape({
      docId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string.isOptional
    })),
    notifications: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      sender: PropTypes.object.isRequired,
      board: PropTypes.object.isRequired
    }))
  }

  static defaultProps = {
    authors: {},
    contacts: {},
    notifications: []
  }

  constructor() {
    super()

    this.state = { tab: 'notifications' }
  }

  handleShare(e, contact) {
    Loop.dispatch(
      Model.identityOfferDocumentToIdentity,
      { identityId: contact.docId, sharedDocId: this.props.board.docId }
    )
  }

  handleUnshare(e, contact) {
    alert(`Unshare '${this.props.board.title}' from ${contact.name}`)
  }

  renderContacts() {
    const authors = Object.keys(this.props.authors).map(id => {
      const author = this.props.authors[id]
      return (
        <Contact
          key={id}
          name={author.name}
          avatar={author.avatar}
          actions={['unshare']}
          onUnshare={e => this.handleUnshare(e, author)}
        />
      )
    })

    const contacts = Object.keys(this.props.contacts).map(id => {
      const contact = this.props.contacts[id]
      return (
        <Contact
          key={id}
          name={contact.name}
          avatar={contact.avatar}
          actions={['share']}
          onShare={e => this.handleShare(e, contact)}
        />
      )
    })

    return (
      <div>
        <h6>On Board</h6>
        <div className="Share__section">
          <div className="Share__authors">
            { authors }
          </div>
        </div>
        { (contacts.length > 0) && <h6>All</h6> }
        <div className="Share__section">
          <div className="Share__contacts">
            { contacts }
          </div>
        </div>
      </div>
    )
  }

  acceptNotification(notification) {
    Loop.dispatch(Model.openAndRequestBoard, { docId: notification.board.docId })
  }

  renderNotifications() {
    const notifications = this.props.notifications.map(notification => (
      // we should create a more unique key; do we want to allow the same share multiple times?
      // i'm going to block it on the send side for now
      <div key={`${notification.sender.name}-${notification.board.title}`} className="Notification">
        <p>You received...</p>
        <h4>{ notification.board.title }</h4>
        <p>From { notification.sender.name }</p>

        <div className="Notification__actions">
          <div
            role="button"
            className="Notification__actions__view"
            onClick={e => this.acceptNotification(notification)}
          >
            <i className="fa fa-arrow-right" /> View
          </div>
          <div
            role="button"
            className="Notification__actions__archive"
            onClick={e => alert(`Archive ${notification.board.title}`)}
          >
            <i className="fa fa-archive" /> Archive
          </div>
        </div>
      </div>
    ))

    return (
      <div className="Share__notifications">
        { notifications }
      </div>
    )
  }

  tabClasses(name) {
    if (this.state.tab === name) { return 'Share__tabs__tab Share__tabs__tab--active' }
    return 'Share__tabs__tab'
  }

  render() {
    let body

    if (this.state.tab === 'contacts') { body = this.renderContacts() } else if (this.state.tab === 'notifications') { body = this.renderNotifications() }

    return (
      <div className="Share">
        <div className="Share__tabs">
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
    )
  }
}
