import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../../content-types'
import Content from '../content'
import { createDocumentLink } from '../../share-link'

class ContactInTitlebar extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    selfId: PropTypes.string.isRequired
  }

  state = {}

  // This is the New Boilerplate
  componentWillMount = () => {
    this.refreshHandle(this.props.docId)
    this.timerId = null
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
      this.handle.release()
    }
    clearTimeout(this.timerId)
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
    this.handle.onMessage(this.onMessage)
  }

  onChange = (doc) => {
    if (this.props.selfId === this.props.docId) {
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

  render = () => {
    let avatar
    if (this.state.avatarDocId) {
      avatar = <Content url={createDocumentLink('image', this.state.avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src="../img/default-avatar.png" />
    }

    return (
      <div>
        <div
          className={`Avatar Avatar--title-bar ${this.state.online ? 'Avatar--online' : 'Avatar--offline'}`}
          style={{ '--highlight-color': this.state.color }}
          data-name={this.state.name}
        >
          { avatar }
        </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: ContactInTitlebar,
  type: 'contact',
  context: 'title-bar',
  name: 'Avatar',
  icon: 'user',
  unlisted: true,
})
