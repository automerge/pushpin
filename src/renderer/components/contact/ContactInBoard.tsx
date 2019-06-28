import React from 'react'
import PropTypes from 'prop-types'

import { ContactDoc } from './index'
import Content, { ContentProps } from '../Content'
import { createDocumentLink } from '../../share-link'
import { DEFAULT_AVATAR_PATH } from '../../constants'
import { Handle } from 'hypermerge';

interface State {
  online: boolean
  doc?: ContactDoc
}

export default class ContactInBoard extends React.PureComponent<ContentProps, State> {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired,
    selfId: PropTypes.string.isRequired
  }

  static minWidth = 4
  static minHeight = 5
  static defaultWidth = 6
  static defaultHeight = 6
  static maxWidth = 9
  static maxHeight = 9

  private handle?: Handle<ContactDoc>
  private timerId?: NodeJS.Timer
  state: State = { online: false }

  // This is the New Boilerplate
  componentWillMount = () => {
    this.openHandle(this.props.hypermergeUrl)
  }

  componentWillUnmount = () => {
    this.handle && this.handle.close()
    this.timerId != null && clearTimeout(this.timerId)
  }

  openHandle = (hypermergeUrl) => {
    this.handle = window.repo.open(hypermergeUrl)
    this.handle.subscribe((doc) => this.onChange(doc))
    this.handle.subscribeMessage((msg) => this.onMessage(msg))
  }


  onChange = (doc) => {
    if (this.props.selfId === this.props.hypermergeUrl) {
      this.setState({ online: true })
    }
    this.setState({ doc })
  }

  onMessage = (msg) => {
    this.timerId != null && clearTimeout(this.timerId)
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
    const { doc, online } = this.state
    if (!doc) return null

    const { avatarDocId, name, color } = doc

    let avatar
    if (avatarDocId) {
      avatar = <Content context="workspace" url={createDocumentLink('image', avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src={DEFAULT_AVATAR_PATH} />
    }

    return (
      <div className="Contact--board">
        <div
          className={`Avatar Avatar--board ${online ? 'Avatar--online' : 'Avatar--offline'}`}
          style={{ '--highlight-color': color } as any}
        >
          {avatar}
        </div>
        <div className="Label">
          {name}
        </div>
      </div>
    )
  }
}
