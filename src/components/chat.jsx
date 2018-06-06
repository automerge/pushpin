import React from 'react'
import PropTypes from 'prop-types'
import ReactToggle from 'react-toggle'

import ContentTypes from '../content-types'
import Content from './content'
import { createDocumentLink } from '../share-link'

export default class Chat extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument(chatDoc) {
    chatDoc.messages = []
  }

  constructor(props) {
    super(props)

    this.handle = null

    this.onScroll = this.onScroll.bind(this)
    this.onInput = this.onInput.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)

    this.state = { message: '', messages: null }
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((chatDoc) => {
      this.setState({ messages: chatDoc.messages })
    })
  }

  render() {
    const messages = (this.state.messages || [])
    const twoHoursAgo = new Date().getTime() - (2 * 60 * 60 * 1000)
    const recentMessages = messages.filter((m) => m.time > twoHoursAgo)
    const groupedMessages = []
    let currentGroup = null
    recentMessages.forEach((message) => {
      if (!currentGroup || (currentGroup.length > 0 && currentGroup[0].authorId !== message.authorId)) {
        currentGroup = []
        groupedMessages.push(currentGroup)
      }
      currentGroup.push(message)
    })
    return (
      <div style={css.chatWrapper}>
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
            placeholder={'Enter your message...'}
          />
        </div>
      </div>
    )
  }

  renderGroupedMessages(groupOfMessages, idx) {
    return (
      <div className="messageGroup" style={css.messageGroup} key={idx}>
          <Content url={createDocumentLink('mini-avatar', groupOfMessages[0].authorId)} />
          <div style={css.groupedMessages}>
            { groupOfMessages.map(this.renderMessage) }
          </div>
      </div>
    )
  }

  renderMessage({ authorId, content, time }, idx) {
    const date = new Date()
    date.setTime(time)

    return (
      <div style={css.message} key={idx}>
        <div style={css.content}>{content}</div>
        <div style={css.time}>{date.getHours()}:{date.getMinutes()}</div>
      </div>
    )
  }

  onScroll(e) {
    e.stopPropagation()
  }

  onInput(e) {
    this.setState({
      message: e.target.value
    })
  }

  onKeyDown(e) {
    e.stopPropagation()

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      this.handle.change((chatDoc) => {
        chatDoc.messages.push({
          authorId: window.selfId,
          content: this.state.message,
          time: new Date().getTime()
        })
      })

      this.setState({
        message: ""
      })
    }
  }
}
// { prev.authorId === authorId
//   ? null
//   :
// }
class MiniAvatar extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      avatarDocId: PropTypes.string,
      name: PropTypes.string,
    }).isRequired
  }

  render() {
    let avatar
    if (this.props.doc.avatarDocId) {
      avatar = <Content url={createDocumentLink('image', this.props.doc.avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src="../img/default-avatar.png" />
    }

    return (
      <div style={css.user}>
        <div className="Avatar" style={css.avatar} title={this.props.doc.name}>
            { avatar }
        </div>
        <div className="username" style={css.username}>
          {this.props.doc.name}
        </div>
      </div>
    )
  }
}

const css = {
  chatWrapper: {
    display: 'flex',
    backgroundColor: 'white',
    width: '100%',
    overflow: 'auto'
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
    marginBottom: -12
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
    color: 'var(--colorSecondaryGrey)'
  },
  avatar: {

  },
  time: {
    flex: 'none',
    marginLeft: 'auto',
    fontSize: 12,
    color: 'var(--colorSecondaryGrey)'
  },
  content: {
  },
  inputWrapper: {
    boxSizing: 'border-box',
    width: '100%',
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
  component: MiniAvatar,
  type: 'mini-avatar',
  name: 'Mini Avatar',
  icon: 'user',
  unlisted: true,
})

ContentTypes.register({
  component: Chat,
  type: 'chat',
  name: 'Chat',
  icon: 'group',
})
