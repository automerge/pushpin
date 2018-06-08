import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../content-types'
import Content from './content'
import { createDocumentLink } from '../share-link'

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

ContentTypes.register({
  component: MiniAvatar,
  type: 'mini-avatar',
  name: 'Mini Avatar',
  icon: 'user',
  unlisted: true,
})
