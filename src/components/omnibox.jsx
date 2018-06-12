import React from 'react'

import Content from './content'
import ContentTypes from '../content-types'
import { createDocumentLink, parseDocumentLink } from '../share-link'

export default class Omnibox extends React.PureComponent {
  state = { visible: true }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)

  componentDidMount = () => document.addEventListener('keydown', this.onKeyDown)

  componentWillUnmount = () => {
    document.removeEventListener('keydown', this.onKeyDown)
    window.hm.releaseHandle(this.handle)
  }

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

  onKeyDown = (e) => {
    if (e.metaKey && e.key === '/') {
      this.setState({ visible: !this.state.visible })
    }
  }

  render() {
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
