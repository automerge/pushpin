import React from 'react'

import Content, { ContentProps } from '../Content'
import { ContactDoc } from '.'
import { Handle } from 'hypermerge'

import { createDocumentLink } from '../../share-link'
import { DEFAULT_AVATAR_PATH } from '../../constants'

interface State {
  online: boolean
  doc?: ContactDoc
}

export default class ContactInTitlebar extends React.PureComponent<ContentProps, State> {
  state: State = { online: false }

  private handle?: Handle<ContactDoc>
  private timerId?: NodeJS.Timeout

  // This is the New Boilerplate
  componentWillMount = () => {
    this.refreshHandle(this.props.hypermergeUrl)
    delete this.timerId
  }

  componentWillUnmount = () => {
    this.handle && this.handle.close()
    this.timerId && clearTimeout(this.timerId)
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

  render() {
    let avatar
    const {doc} = this.state
    if (!doc) return null

    const { avatarDocId, name, color } = doc

    if (avatarDocId) {
      avatar = <Content context="workspace" url={createDocumentLink('image', avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src={DEFAULT_AVATAR_PATH} />
    }

    return (
      <div>
        <div
          draggable
          onDragStart={this.onDragStart}
          className={`Avatar Avatar--title-bar ${this.state.online ? 'Avatar--online' : 'Avatar--offline'}`}
          style={{ '--highlight-color': color } as any}
          data-name={name}
        >
          {avatar}
        </div>
      </div>
    )
  }
}
