import React from 'react'

import { Handle } from 'hypermerge'
import ContentTypes from '../ContentTypes'
import { ContentProps } from Content from './Content'
import { createDocumentLink } from '../ShareLink'


interface Message {
  authorId: string
  content: string
  time: number // Unix timestamp
}

interface Doc {
  messages: Message[]
}

interface State {
  doc?: Doc
  message: string
}

export default class ThreadContent extends React.PureComponent<ContentProps, State> {
  static minWidth = 9
  static minHeight = 6
  static defaultWidth = 16
  static defaultHeight = 18
  static maxWidth = 24
  static maxHeight = 36

  handle?: Handle<Doc>
  state: State = { message: '' }

  // This is the New Boilerplate
  componentWillMount = () => {
    this.handle = window.repo.watch(this.props.hypermergeUrl, (doc: Doc) => this.onChange(doc))
  }
  componentWillUnmount = () => this.handle && this.handle.close()

  onChange = (doc: Doc) => {
    this.setState({ doc })
  }

  render = () => {
    const { doc } = this.state
    if (!doc) {
      return null
    }

    const messages = doc.messages || []
    const groupedMessages: Message[][] = []
    let currentGroup: Message[]
    messages.forEach((message) => {
      if (
        !currentGroup ||
        (currentGroup.length > 0 && currentGroup[0].authorId !== message.authorId)
      ) {
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
            onChange={this.onInput}
            onPaste={this.onPaste}
            placeholder="Enter your message..."
          />
        </div>
      </div>
    )
  }

  renderGroupedMessages = (groupOfMessages: Message[], idx: number) => (
    <div style={css.messageGroup} key={idx}>
      <Content context="thread" url={createDocumentLink('contact', groupOfMessages[0].authorId)} />
      <div style={css.groupedMessages}>{groupOfMessages.map(this.renderMessage)}</div>
    </div>
  )

  renderMessage = ({ content, time }: Message, idx: number) => {
    const date = new Date()
    date.setTime(time)
    const options = {
      localeMatcher: 'best fit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    }
    return (
      <div style={css.message} key={idx}>
        <div style={css.content}>{content}</div>
        {idx === 0 ? (
          <div style={css.time}>{new Intl.DateTimeFormat('en-US', options).format(date)}</div>
        ) : null}
      </div>
    )
  }

  onScroll = (e: React.UIEvent) => {
    e.stopPropagation()
  }

  onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target) {
      this.setState({
        message: e.target.value,
      })
    }
  }

  onPaste = (e: React.ClipboardEvent) => {
    e.stopPropagation()
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()

    const { message } = this.state
    if (e.key === 'Enter' && !e.shiftKey && message) {
      e.preventDefault()
      this.handle &&
        this.handle.change((threadDoc: Doc) => {
          threadDoc.messages.push({
            authorId: this.props.selfId,
            content: message,
            time: new Date().getTime(),
          })
        })

      this.setState({
        message: '',
      })
    }
  }
}

const css = {
  threadWrapper: {
    display: 'flex' as 'flex',
    backgroundColor: 'white',
    width: '100%',
    overflow: 'auto' as 'auto',
    height: '100%',
    padding: '1px 1px 0px 1px',
  },
  messageWrapper: {
    padding: 12,
    position: 'relative' as 'relative',
    display: 'flex' as 'flex',
    flexDirection: 'column-reverse' as 'column-reverse',
    overflowY: 'scroll' as 'scroll',
    marginBottom: 49,
    flexGrow: 1,
  },
  messageGroup: {
    marginBottom: -24,
    paddingTop: 12,
  },
  groupedMessages: {
    position: 'relative' as 'relative',
    top: -20,
    paddingLeft: 40 + 8,
  },
  messages: {
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    justifyContent: 'flex-end' as 'flex-end',
    flexGrow: 1,
  },
  message: {
    color: 'black',
    display: 'flex' as 'flex',
    lineHeight: '20px',
    padding: '2px 0',
  },
  user: {
    display: 'flex' as 'flex',
  },
  username: {
    paddingLeft: 8,
    fontSize: 12,
    color: 'var(--colorBlueBlack)',
  },
  avatar: {},
  time: {
    flex: 'none' as 'none',
    position: 'absolute' as 'absolute',
    right: 0,
    fontSize: 12,
    color: 'var(--colorSecondaryGrey)',
    marginTop: -22,
  },
  content: {},
  inputWrapper: {
    boxSizing: 'border-box' as 'border-box',
    width: 'calc(100% - 2px)',
    borderTop: '1px solid var(--colorInputGrey)',
    position: 'absolute' as 'absolute',
    bottom: 1,
    backgroundColor: 'white',
    padding: 8,
  },
  input: {
    width: '100%',
  },
}

function initializeDocument(threadDoc: Doc) {
  threadDoc.messages = []
}

ContentTypes.register({
  type: 'thread',
  name: 'Thread',
  icon: 'comments',
  contexts: {
    workspace: ThreadContent,
    board: ThreadContent,
  },
  initializeDocument,
})
