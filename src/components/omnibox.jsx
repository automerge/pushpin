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
    this.state = { invitations: [], selectedIndex: -1 }
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

    return this.menuItems().items[selectedIndex]
  }

  moveDown = () => {
    const { items, sectionIndices } = this.menuItems()
    let { selectedIndex } = this.state

    if (selectedIndex < (items.length - 1)) {
      selectedIndex += 1
      this.setState({ selectedIndex })
    }

    return this.menuItems().items[selectedIndex]
  }

  menuItems = () => {
    let items = []
    const sectionIndices = {}

    const invitationItems = this.state.invitations.map(invitation => ({ type: 'invitation', object: invitation }))
    sectionIndices.invitations = { start: items.length, end: invitationItems.length }
    items = items.concat(invitationItems)

    const viewedDocUrls = this.state.viewedDocUrls.filter(url => parseDocumentLink(url).type === 'board')
    const viewedDocItems = viewedDocUrls.map(docUrl => ({ type: 'viewedDocUrl', object: docUrl }))
    sectionIndices.viewedDocUrls = { start: items.length }
    items = items.concat(viewedDocItems)

    if (items[this.state.selectedIndex]) {
      items[this.state.selectedIndex].selected = true
    }

    return { items, sectionIndices }
  }

  sectionItems = (name) => {
    const { items, sectionIndices } = this.menuItems()
    const { start, end } = sectionIndices[name]

    return items.slice(start, end)
  }

  render() {
    log('render', this.state)

    if (!this.props.visible) {
      return null
    }

    if (!this.state.currentDocUrl) {
      return null
    }

    const invitations = this.sectionItems('invitations').map((item) => {
      const invitation = item.object
      const classes = item.selected ? 'ListMenu__item ListMenu__item--selected' : 'ListMenu__item'

      return <div key={`${invitation.sender.docId}-${invitation.documentUrl}`} className={classes}>
        <div className="Invitation">
          <i className="Badge fa fa-envelope" style={{ background: invitation.doc && invitation.doc.backgroundColor }} />
          <div className="Invitation__body">
            <h4 className="Type--primary">{ invitation.doc.title || 'Untitled' }</h4>
            <p className="Type--secondary">From { invitation.sender.name }</p>
          </div>
        </div>

        <div className="ListMenu Actions">
          <span className="Type--secondary">⌫  Archive</span>
          <span className="Type--secondary">⏎ View</span>
        </div>
      </div>
    })

    const boardDocLinks = this.sectionItems('viewedDocUrls').map((item) => {
      const url = item.object
      const { docId, type } = parseDocumentLink(url)
      const docLinkUrl = createDocumentLink('doc-link', docId)
      const classes = item.selected ? 'ListMenu__item ListMenu__item--selected' : 'ListMenu__item'

      return (
        <div key={url} className={classes}>
          <Content url={docLinkUrl} linkedDocumentType={type} />

          <div className="ListMenu Actions">
            <span className="Type--secondary">⌫  Archive</span>
            <span className="Type--secondary">⏎ View</span>
          </div>
        </div>
      )
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
