import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../../content-types'
import Content from '../content'
import { createDocumentLink } from '../../share-link'
import { DEFAULT_AVATAR_PATH } from '../../constants'

export default class ContactInList extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    selfId: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PropTypes.string),
    onShare: PropTypes.func,
    onUnshare: PropTypes.func
  }

  static defaultProps = {
    actions: [],
    onShare: () => {},
    onUnshare: () => {}
  }

  state = {}

  // This is the New Boilerplate
  componentWillMount = () => {
    this.refreshHandle(this.props.docId)
  }

  componentWillUnmount = () => {
    this.handle.close()
    clearTimeout(this.timerId)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(docId, (doc) => this.onChange(doc))
  } // onMessage!?


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

  onDragStart = (e) => {
    e.dataTransfer.setData(
      'application/pushpin-url',
      createDocumentLink('contact', this.props.docId)
    )
  }

  render = () => {
    const actions = []
    if (this.props.actions.includes('share')) {
      actions.push((
        <div role="button" key="share" onClick={this.props.onShare} className="ButtonAction ButtonAction--primary">
          <i className="fa fa-share-alt" />
        </div>
      ))
    }

    if (this.props.actions.includes('unshare')) {
      actions.push((
        <div role="button" key="unshare" onClick={this.props.onUnshare} className="ButtonAction ButtonAction--destructive">
          <i className="fa fa-ban" />
        </div>
      ))
    }

    if (this.props.actions.includes('invite')) {
      actions.push(<span key="invite" className="Type--secondary">⏎ Invite</span>)
    }

    let avatar
    if (this.state.avatarDocId) {
      avatar = <Content url={createDocumentLink('image', this.state.avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src={DEFAULT_AVATAR_PATH} />
    }

    return (
      <div draggable="true" onDragStart={this.onDragStart} className="ContactListItem">
        <div className="ListMenu__thumbnail">
          <div
            className={`Avatar ${this.state.online ? 'Avatar--online' : 'Avatar--offline'}`}
            style={{ '--highlight-color': this.state.color }}
          >
            { avatar }
          </div>
        </div>
        <div className="Label">
          <p className="Type--primary">
            { this.state.name }
          </p>
        </div>

        <div className="Actions"> { actions } </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: ContactInList,
  type: 'contact',
  context: 'list',
  name: 'Contact',
  icon: 'sticky-note',
  unlisted: true,
})
