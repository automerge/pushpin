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
