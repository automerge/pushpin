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

  state = {}

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.currentDocUrl)
  componentWillUnmount = () => window.hm.releaseHandle(this.handle)
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.currentDocUrl !== this.props.currentDocUrl) {
      this.refreshHandle(this.props.currentDocUrl)
    }
  }
  refreshHandle = (currentDocUrl) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
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
    console.log(msg, peer)
  }

  render = () => {
    log('render')

    const contacts = (this.state.authorIds || []).map((contactId) =>
      <Content context="title-bar" url={createDocumentLink('contact', contactId)} />)

    return (
      <div className="PresentContacts">
        {contacts}
      </div>
    )
  }
}

