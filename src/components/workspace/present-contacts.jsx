import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import { parseDocumentLink, createDocumentLink } from '../../share-link'
import Content from '../content'

const log = Debug('pushpin:present-contacts')

export default class PresentContacts extends React.PureComponent {
  static propTypes = {
    currentDocUrl: PropTypes.string.isRequired
  }

  state = { presentContacts: {} }
  presentContactsTimerId = {}

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.currentDocUrl)
  componentWillUnmount = () => this.handle.release()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.currentDocUrl !== this.props.currentDocUrl) {
      this.clearContacts()
      this.refreshHandle(this.props.currentDocUrl)
    }
  }
  refreshHandle = (currentDocUrl) => {
    if (this.handle) {
      this.handle.release()
    }
    const { docId } = parseDocumentLink(currentDocUrl)
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
    this.handle.onMessage(this.onMessage)
  }

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  onMessage = ({ msg, peer }) => {
    const { contact, departing } = msg
    if (contact) {
      if (departing) {
        clearTimeout(this.presentContactsTimerId[contact])
        this.contactAbsent(contact)()
        return
      }
      this.contactPresent(contact)
      clearTimeout(this.presentContactsTimerId[contact])
      this.presentContactsTimerId[contact]
        = setTimeout(this.contactAbsent(contact), 11000)
    }
  }

  contactPresent = (contact) => {
    if (!this.state.presentContacts[contact]) {
      this.setState({ presentContacts:
        { ...this.state.presentContacts, [contact]: true } })
    }
  }

  clearContacts = () => {
    this.setState({ presentContacts: { } })
  }

  // note this is a function that returns a function for setTimeout to use
  contactAbsent = (contact) => () => {
    if (this.state.presentContacts[contact]) {
      // destructure to make a copy rather than mutating the old one
      const presentContacts = { ...this.state.presentContacts }
      delete presentContacts[contact]
      this.setState({ presentContacts })
    }
  }

  render = () => {
    log('render')

    const present = Object.keys(this.state.presentContacts)
    const contacts = present.map((contactId) =>
      <Content key={contactId} context="title-bar" url={createDocumentLink('contact', contactId)} />)

    return (
      <div className="PresentContacts">
        {contacts}
      </div>
    )
  }
}

