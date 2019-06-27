import React from 'react'
import PropTypes from 'prop-types'

import Content from '../content'
import { createDocumentLink } from '../../share-link'
import { DEFAULT_AVATAR_PATH } from '../../constants'

export default class ContactInList extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired,
    selfId: PropTypes.string.isRequired
  }

  state = {}

  // This is the New Boilerplate
  componentWillMount = () => {
    this.refreshHandle(this.props.hypermergeUrl)
  }

  componentWillUnmount = () => {
    this.handle.close()
    clearTimeout(this.timerId)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.open(hypermergeUrl)
    this.handle.subscribe((doc) => this.onChange(doc))
    this.handle.subscribeMessage((msg) => this.onMessage(msg))
  }


  onChange = (doc) => {
    if (this.props.selfId === this.props.hypermergeUrl) {
      this.setState({ online: true })
    }
    this.setState({ ...doc })
  }

  onMessage = (msg) => {
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
      createDocumentLink('contact', this.props.hypermergeUrl)
    )
  }

  render = () => {
    let avatar
    if (this.state.avatarDocId) {
      avatar = <Content context="workspace" url={createDocumentLink('image', this.state.avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src={DEFAULT_AVATAR_PATH} />
    }

    return (
      <div draggable="true" onDragStart={this.onDragStart} className="DocLink">
        <div className="ListMenu__thumbnail">
          <div
            className={`Avatar ${this.state.online ? 'Avatar--online' : 'Avatar--offline'}`}
            style={{ '--highlight-color': this.state.color }}
          >
            {avatar}
          </div>
        </div>
        <div className="Label">
          <p className="Type--primary">
            {this.state.name}
          </p>
        </div>
      </div>
    )
  }
}
