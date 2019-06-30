import React from 'react'

import Content, { ContentProps } from '../Content'
import { ContactDoc } from '.'
import { Handle } from 'hypermerge'

import { createDocumentLink } from '../../ShareLink'
import { DEFAULT_AVATAR_PATH } from '../../constants'

import './ContactInVarious.css'

interface State {
  online: boolean
  doc?: ContactDoc
}

export default class ContactInVarious extends React.PureComponent<ContentProps, State> {
  private handle?: Handle<ContactDoc>
  private timerId?: NodeJS.Timeout
  state: State = { online: false }

  // This is the New Boilerplate
  componentWillMount = () => {
    this.handle = window.repo.open(this.props.hypermergeUrl)
    this.handle.subscribe((doc) => this.onChange(doc))
    this.handle.subscribeMessage((msg) => this.onMessage(msg))
  }

  componentWillUnmount = () => {
    this.handle && this.handle.close()
    this.timerId && clearTimeout(this.timerId)
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
    switch (this.props.context) {
      case "list":
        return this.renderList();
        break;
      case "thread":
        return this.renderThread()
        break
      case "title-bar":
        return this.renderTitleBar()
        break;
      case "board":
        return this.renderBoard()
        break;
    }
    return null
  }

  renderList() {
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
      <div draggable onDragStart={this.onDragStart} className="DocLink">
        <div className="ListMenu__thumbnail">
          <div
            className={`Avatar ${online ? 'Avatar--online' : 'Avatar--offline'}`}
            style={{ '--highlight-color': color } as any}
          >
            {avatar}
          </div>
        </div>
        <div className="Label">
          <p className="Type--primary">
            {name}
          </p>
        </div>
      </div>
    )
  }

  renderThread() {
    const { doc, online } = this.state
    if (!doc) return null

    const { avatarDocId, name, color } = doc

    let avatar
    if (avatarDocId) {
      avatar = <Content context="workspace" url={createDocumentLink('image', avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src={DEFAULT_AVATAR_PATH} />
    }

    const avatarStyle = { ...css.avatar }
    if (color) {
      avatarStyle['--highlight-color'] = color
    }

    return (
      <div style={css.user}>
        <div
          className={`Avatar ${online ? 'Avatar--online' : 'Avatar--offline'}`}
          style={avatarStyle}
          title={name}
        >
          {avatar}
        </div>
        <div className="username" style={css.username}>
          {name}
        </div>
      </div>
    )
  }

  renderTitleBar() {
    let avatar
    const { doc } = this.state
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

  renderBoard() {
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

const css = {
  threadWrapper: {
    display: 'flex',
    backgroundColor: 'white',
    width: '100%',
    overflow: 'auto',
    height: '100%',
  },
  messageWrapper: {
    padding: 12,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column-reverse',
    overflowY: 'scroll',
    marginBottom: 49,
    flexGrow: 1,
  },
  messageGroup: {
    marginBottom: -24,
    paddingTop: 12
  },
  groupedMessages: {
    position: 'relative',
    top: -20,
    paddingLeft: 40 + 8
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    flexGrow: '1',
  },
  message: {
    color: 'black',
    display: 'flex',
    lineHeight: '20px',
    padding: '2px 0'
  },
  user: {
    display: 'flex'
  },
  username: {
    paddingLeft: 8,
    fontSize: 12,
    color: 'var(--colorBlueBlack)'
  },
  avatar: {

  },
  time: {
    flex: 'none',
    marginLeft: 'auto',
    fontSize: 12,
    color: 'var(--colorSecondaryGrey)',
    marginTop: -22
  },
  content: {
  },
  inputWrapper: {
    boxSizing: 'border-box',
    width: 'calc(100% - 1px)',
    borderTop: '1px solid var(--colorInputGrey)',
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'white',
    padding: 8,
  },
  input: {
    width: '100%'
  },
}
