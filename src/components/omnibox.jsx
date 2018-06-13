import React from 'react'
import Debug from 'debug'
import PropTypes from 'prop-types'

import Content from './content'
import ContentTypes from '../content-types'
import InvitationsView from '../invitations-view'
import { createDocumentLink, parseDocumentLink } from '../share-link'

const log = Debug('pushpin:omnibox')

export default class Omnibox extends React.PureComponent {
  static propTypes = {
    visible: PropTypes.bool.isRequired,
    search: PropTypes.string,
    move: PropTypes.string,
    getKeyController: PropTypes.func
  }

  static defaultProps = {
    search: ''
  }

  constructor(props) {
    super(props)
    this.state = { invitations: [], selectedIndex: 0 }
  }

  // This is the New Boilerplate
  componentWillMount = () => {
    log('componentWillMount')
  }

  componentDidMount = () => {
    log('componentDidMount')
    this.refreshHandle(this.props.docId)
    this.invitationsView = new InvitationsView(this.props.docId)
    this.invitationsView.onChange(this.onInvitationsChange)
    this.props.getKeyController({ moveUp: this.moveUp, moveDown: this.moveDown })
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
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

  onInvitationsChange = (invitations) => {
    log('invitations change')
    this.setState({ invitations })
  }

  onChange = (doc) => {
    log('onChange', doc)
    this.setState({ ...doc })
  }

  moveUp = () => {
    let { selectedIndex } = this.state

    if (selectedIndex > 0) {
      selectedIndex -= 1
      this.setState({ selectedIndex })
    }
  }

  moveDown = () => {
    this.setState({ selectedIndex: this.state.selectedIndex + 1 })
  }

  render() {
    log('render', this.state)

    if (!this.props.visible) {
      return null
    }

    if (!this.state.currentDocUrl) {
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
      return <Content key={id} url={createDocumentLink('contact', id)} />
    })

    const invitations = this.state.invitations.map(invitation => {
      return <div key={`${invitation.sender.docId}-${invitation.documentUrl}`} className="ListMenu__item">
        <div className="Invitation">
          <i className="Badge fa fa-envelope" style={{ background: invitation.doc && invitation.doc.backgroundColor }} />
          <div className="Invitation__body">
            <h4 className="Type--primary">{ invitation.doc.title || 'Untitled' }</h4>
            <p className="Type--secondary">From { invitation.sender.name }</p>
          </div>
        </div>
      </div>
    })

    return <div className="Omnibox">
      <div className="ListMenu">
        <div className="ListMenu__segment">Invitations</div>
        <div className="ListMenuSection">
          { invitations }
        </div>

        <div className="ListMenu__segment">Boards</div>
        <div className="ListMenuSection">
          { boardDocLinks }
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
