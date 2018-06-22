import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../../content-types'
import Content from '../content'
import { createDocumentLink } from '../../share-link'

export default class ContactInBoard extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
  }

  static minWidth = 4
  static minHeight = 5
  static defaultWidth = 6
  static defaultHeight = 6
  static maxWidth = 9
  static maxHeight = 9

  state = {}

  // This is the New Boilerplate
  componentWillMount = () => {
    this.refreshHandle(this.props.docId)
  }

  componentWillUnmount = () => {
    this.handle.release()
    clearTimeout(this.timerId)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.release(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
    this.handle.onMessage(this.onMessage)
  }

  onChange = (doc) => {
    if (window.selfId === this.props.docId) {
      this.setState({ online: true })
    }
    this.setState({ ...doc })
  }

  onMessage = ({ msg, peer }) => {
    clearTimeout(this.timerId)
    // if we miss two heartbeats (11s), assume they've gone offline
    this.timerId = setTimeout(() => {
      this.setState({ online: false })
    }, 11000)
    this.setState({ online: true })
  }

  onDragStart = (e) => {
    e.dataTransfer.setData(
      'application/pushpin-url',
      createDocumentLink('contact', this.props.docId)
    )
  }

  render = () => {
    let avatar
    if (this.state.avatarDocId) {
      avatar = <Content url={createDocumentLink('image', this.state.avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src="../img/default-avatar.png" />
    }

    return (
      <div className="Contact--board">
        <div className={`Avatar Avatar--board ${this.state.online ? 'Avatar--online' : 'Avatar--offline'}`}>
          { avatar }
        </div>
        <div className="Label">
          { this.state.name }
        </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: ContactInBoard,
  type: 'contact',
  context: 'board',
  name: 'Contact',
  icon: 'sticky-note',
  resizable: true,
  unlisted: true,
})
