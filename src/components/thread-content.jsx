import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../content-types'
import Content from './content'
import { createDocumentLink } from '../share-link'

export default class ThreadContent extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument(threadDoc) {
    threadDoc.messages = []
  }

  state = { message: '', messages: null }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => window.hm.releaseHandle(this.handle)
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  render = () => {
    const messages = (this.state.messages || [])
    const groupedMessages = []
    let currentGroup = null
    messages.forEach((message) => {
      if (!currentGroup
        || (currentGroup.length > 0 && currentGroup[0].authorId !== message.authorId)) {
        currentGroup = []
        groupedMessages.push(currentGroup)
      }
      currentGroup.push(message)
    })
    return (
      <div style={css.threadWrapper}>
        <div style={css.messageWrapper}>
          <div style={css.messages} onScroll={this.onScroll}>
            {groupedMessages.map(this.renderGroupedMessages, this)}
          </div>
        </div>
        <div style={css.inputWrapper}>
          <input
            style={css.input}
            value={this.state.message}
            onKeyDown={this.onKeyDown}
            onInput={this.onInput}
            placeholder="Enter your message..."
          />
        </div>
      </div>
    )
  }

  renderGroupedMessages = (groupOfMessages, idx) => (
    <div style={css.messageGroup} key={idx}>
      <Content context="mini" url={createDocumentLink('contact', groupOfMessages[0].authorId)} />
      <div style={css.groupedMessages}>
        { groupOfMessages.map(this.renderMessage) }
      </div>
    </div>
  )

  renderMessage = ({ authorId, content, time }, idx) => {
    const date = new Date()
    date.setTime(time)
    const options = {
      localeMatcher: 'best fit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    }
    return (
      <div style={css.message} key={idx}>
        <div style={css.content}>{content}</div>
        { idx === 0 ? <div style={css.time}>{new Intl.DateTimeFormat('en-US', options).format(date)}</div> : null}
      </div>
    )
  }

  onScroll= (e) => {
    e.stopPropagation()
  }

  onInput = (e) => {
    this.setState({
      message: e.target.value
    })
  }

  onKeyDown = (e) => {
    e.stopPropagation()

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      this.handle.change((threadDoc) => {
        threadDoc.messages.push({
          authorId: window.selfId,
          content: this.state.message,
          time: new Date().getTime()
        })
      })

      this.setState({
        message: ''
      })
    }
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
    position: 'absolute',
    right: 0,
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

ContentTypes.register({
  component: ThreadContent,
  type: 'thread',
  name: 'Thread',
  icon: 'comments',
})
