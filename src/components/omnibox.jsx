import React from 'react'
import Debug from 'debug'

import Content from './content'
import ContentTypes from '../content-types'
import InvitationsView from '../invitations-view'
import { createDocumentLink, parseDocumentLink } from '../share-link'

const log = Debug('pushpin:omnibox')

export default class Omnibox extends React.PureComponent {
  state = { visible: true, invitations: [] }

  // This is the New Boilerplate
  componentWillMount = () => {
    log('componentWillMount')
    this.invitationsView = new InvitationsView(this.props.docId)
    this.invitationsView.onChange((invitations) => {
      log('invitations change')
      // This does not trigger a re-render for some reason,
      // adding a forceUpdate for now
      this.setState({ invitations }, () => this.forceUpdate())
    })
    this.refreshHandle(this.props.docId)
  }

  componentDidMount = () => {
    log('componentDidMount')
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
    document.removeEventListener('keydown', this.onKeyDown)
    window.hm.releaseHandle(this.handle)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    log('componentDidUpdate')
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

  onKeyDown = (e) => {
    if (e.metaKey && e.key === '/') {
      this.setState({ visible: !this.state.visible })
    }
  }

  render() {
    log('render')

    if (!this.state.visible) {
      return null
    }

    const boardDocUrls = this.state.viewedDocUrls.filter(url => parseDocumentLink(url).type === 'board')
    const boardDocLinks = boardDocUrls.map(url => {
      const { docId, type } = parseDocumentLink(url)
      const docLinkUrl = createDocumentLink('doc-link', docId)

      return (
        <div key={url} className="ListMenu__item">
          <Content url={docLinkUrl} linkedDocumentType={type} />
        </div>
      )
    })

    const contacts = this.state.contactIds.map(id => {
      return <Content url={createDocumentLink('contact', id)} />
    })

    const invitations = this.state.invitations.map(invitation => {
      return <div key={`${invitation.sender.docId}-${invitation.documentUrl}`} className="ListMenu__item">
        <div className="ListMenu__typegroup">
          <h4 className="Type--primary">{ invitation.doc.title || 'Untitled' }</h4>
          <p className="Type--secondary">From { invitation.sender.name }</p>
        </div>
      </div>
    })

    return <div className="Omnibox">
      <div className="ListMenu">
        <div className="ListMenu__segment">All Boards</div>
        <div className="ListMenuSection">
          { boardDocLinks }
        </div>

        <div className="ListMenu__segment">Contacts</div>
        <div className="ListMenuSection">
          { contacts }
        </div>

        <div className="ListMenu__segment">Invitations</div>
        <div className="ListMenuSection">
          { invitations }
        </div>
      </div>
    </div>
  }
}

ContentTypes.register({
  component: Omnibox,
  type: 'omnibox',
  name: 'Omnibox',
  icon: 'sticky-note',
  unlisted: true
})
