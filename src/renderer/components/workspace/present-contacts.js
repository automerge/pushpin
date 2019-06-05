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
  componentWillUnmount = () => this.handle.close()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.currentDocUrl !== this.props.currentDocUrl) {
      this.clearContacts()
      this.refreshHandle(this.props.currentDocUrl)
    }
  }

  refreshHandle = (currentDocUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    const { hypermergeUrl } = parseDocumentLink(currentDocUrl)
    this.handle = window.repo.open(hypermergeUrl)
    this.handle.subscribe((doc) => this.onChange(doc))
    this.handle.subscribeMessage((msg) => this.onMessage(msg))
  }

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  onMessage = (msg) => {
    const { contact, departing } = msg
    if (contact) {
      if (departing) {
        clearTimeout(this.presentContactsTimerId[contact])
        this.contactAbsent(contact)()
        return
      }
      this.contactPresent(contact)
      clearTimeout(this.presentContactsTimerId[contact])
      this.presentContactsTimerId[contact] = setTimeout(this.contactAbsent(contact), 11000)
    }
  }

  contactPresent = (contact) => {
    if (!this.state.presentContacts[contact]) {
      this.setState((prevState) => ({ presentContacts:
        { ...prevState.presentContacts, [contact]: true } }
      ))
    }
  }

  clearContacts = () => {
    this.setState({ presentContacts: { } })
  }

  // note this is a function that returns a function for setTimeout to use
  contactAbsent = (contact) => () => {
    if (this.state.presentContacts[contact]) {
      this.setState((prevState) => {
        // destructure to make a copy rather than mutating the old one
        const presentContacts = { ...prevState.presentContacts }
        delete presentContacts[contact]
        return { presentContacts }
      })
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
