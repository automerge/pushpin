import React from 'react'
import PropTypes from 'prop-types'

import Contact from './contact'
import Loop from '../loop'
import * as Model from '../models/model'
import * as Identity from '../models/identity'

export default class Share extends React.PureComponent {
  static propTypes = {
    authors: PropTypes.arrayOf(PropTypes.shape({
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
    authors: [],
    contacts: {},
    notifications: []
  }

  constructor() {
    super()

    this.state = { tab: 'notifications' }
  }

  handleShare(e, contact) {
    Loop.dispatch(
      Identity.updateSelfOfferDocumentToIdentity,
      { identityId: contact.docId, sharedDocId: this.props.board.docId }
    )
  }

  handleUnshare(e, contact) {
    alert(`Unshare '${this.props.board.title}' Received from ${contact.name}`)
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
    Loop.dispatch(Model.openAndRequestBoard, { docId: notification.board.docId })
  }

  renderNotifications() {
    const notifications = this.props.notifications.map(notification => (
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
        { notifications.length > 0 ? notifications :
        <div className="ListMenu__grouped">
          <i className="fa fa-info-circle"/>
          <p className="Type--primary">
            Nobody has shared any documents with you.
            Documents are like love. You have got to give
            a little to get a little.
          </p>
        </div> }
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
