import React from 'react'
import Debug from 'debug'
import PropTypes from 'prop-types'

import Content from '../content'
import { createDocumentLink, parseDocumentLink } from '../../share-link'

const log = Debug('pushpin:omnibox')

export default class Omnibox extends React.PureComponent {
  static propTypes = {
    visible: PropTypes.bool.isRequired,
    search: PropTypes.string,
    getKeyController: PropTypes.func.isRequired,
    invitations: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    docId: PropTypes.string.isRequired
  }

  static defaultProps = {
    search: ''
  }

  constructor(props) {
    super(props)
    this.state = { selectedIndex: -1, viewedDocs: {}, contacts: {} }
    this.viewedDocHandles = {}
    this.contactHandles = {}
  }

  // This is the New Boilerplate
  componentWillMount = () => {
    log('componentWillMount')
  }

  componentDidMount = () => {
    log('componentDidMount')
    this.refreshHandle(this.props.docId)
    this.props.getKeyController({ moveUp: this.moveUp, moveDown: this.moveDown })
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
    window.hm.releaseHandle(this.handle)
    Object.values(this.viewedDocHandles).forEach(handle => window.hm.releaseHandle(handle))
    Object.values(this.contactHandles).forEach(handle => window.hm.releaseHandle(handle))
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    log('componentDidUpdate')
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }

    if ((this.props.visible && !prevProps.visible) ||
        (this.props.search !== prevProps.search)) {
      this.setState({ selectedIndex: -1 })
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
    log('onChange', doc)
    this.setState({ ...doc }, () => {
      this.state.viewedDocUrls.forEach(url => {
        // create a handle for this document
        if (!this.viewedDocHandles[url]) {
          const { docId } = parseDocumentLink(url)
          const handle = window.hm.openHandle(docId)
          this.viewedDocHandles[url] = handle

          // when it changes, stick the contents of the document
          // into this.state.viewedDocs[url]
          handle.onChange((doc) => {
            this.setState((state, props) => {
              const { viewedDocs } = state
              viewedDocs[url] = doc
              return { viewedDocs }
            })
          })
        }
      })

      this.state.contactIds.forEach(contactId => {
        // create a handle for each contact
        if (!this.contactHandles[contactId]) {
          const handle = window.hm.openHandle(contactId)
          this.contactHandles[contactId] = handle

          // when it changes, put it into this.state.contacts[contactId]
          handle.onChange((doc) => {
            this.setState((state, props) => {
              const { contacts } = state
              contacts[contactId] = doc
              return { contacts }
            })
          })
        }
      })
    })
  }

  moveUp = () => {
    let { selectedIndex } = this.state

    if (selectedIndex > 0) {
      selectedIndex -= 1
      this.setState({ selectedIndex })
    }

    return this.menuSections().items[selectedIndex]
  }

  moveDown = () => {
    const { items } = this.menuSections()
    let { selectedIndex } = this.state

    if (selectedIndex < (items.length - 1)) {
      selectedIndex += 1
      this.setState({ selectedIndex })
    }

    return this.menuSections().items[selectedIndex]
  }

  menuSections = () => {
    let items = []
    const sectionIndices = {}
    const { search } = this.props

    try {
      parseDocumentLink(search)
      items.push({ type: 'docUrl', object: search, url: search })
      sectionIndices.docUrls = { start: 0 }

      if (items[this.state.selectedIndex]) {
        items[this.state.selectedIndex].selected = true
      }

      return { items, sectionIndices }
    } catch (e) {
      log('menuSections.error', e)
    }

    const invitationItems = this.props.invitations
      .filter(invitation => invitation.doc.title.match(new RegExp(search, 'i')))
      .map(invitation => ({ type: 'invitation', object: invitation, url: invitation.documentUrl }))

    sectionIndices.invitations = { start: items.length, end: invitationItems.length }
    items = items.concat(invitationItems)

    if (search.length > 0) {
      const contactItems = Object.entries(this.state.contacts)
        .filter(([id, doc]) => doc.name)
        .filter(([id, doc]) => doc.name.match(new RegExp(search, 'i')))
        .map(([id, doc]) => ({ type: 'contact', object: doc, id, url: createDocumentLink('contact', id) }))

      sectionIndices.contacts = { start: items.length, end: (items.length + contactItems.length) }
      items = items.concat(contactItems)
    }

    const viewedDocItems = Object.entries(this.state.viewedDocs)
      .filter(([url, doc]) => (parseDocumentLink(url).type === 'board'))
      .filter(([url, doc]) => doc.title.match(new RegExp(search, 'i')))
      .map(([url, doc]) => ({ type: 'viewedDocUrl', object: doc, url }))

    sectionIndices.viewedDocUrls = { start: items.length }
    items = items.concat(viewedDocItems)

    if (items[this.state.selectedIndex]) {
      items[this.state.selectedIndex].selected = true
    }

    return { items, sectionIndices }
  }

  sectionItems = (name) => {
    const { items, sectionIndices } = this.menuSections()
    const { start, end } = sectionIndices[name] || {}

    if (Number.isInteger(start)) {
      return items.slice(start, end)
    }

    return []
  }

  renderInvitationsSection() {
    const invitations = this.sectionItems('invitations').map((item) => {
      const invitation = item.object
      const classes = item.selected ? 'ListMenu__item ListMenu__item--selected' : 'ListMenu__item'

      return (
        <div key={`${invitation.sender.docId}-${invitation.documentUrl}`} className={classes}>
          <div className="Invitation">
            <i className="Badge fa fa-envelope" style={{ background: invitation.doc && invitation.doc.backgroundColor }} />
            <div className="Invitation__body">
              <h4 className="Type--primary">{ invitation.doc.title || 'Untitled' }</h4>
              <p className="Type--secondary">From { invitation.sender.name }</p>
            </div>
          </div>

          <div className="ListMenu Actions">
            <span className="Type--secondary">⏎ View</span>
          </div>
        </div>
      )
    })

    if (invitations.length > 0) {
      return (
        <div>
          <div className="ListMenu__segment">Invitations</div>
          <div className="ListMenuSection">
            { invitations }
          </div>
        </div>
      )
    }

    return null
  }

  renderViewedDocLinksSection() {
    const viewedDocLinks = this.sectionItems('viewedDocUrls').map((item) => {
      const { url } = item
      const classes = item.selected ? 'ListMenu__item ListMenu__item--selected' : 'ListMenu__item'

      return (
        <div key={url} className={classes}>
          <Content context="list" url={url} />

          <div className="ListMenu Actions">
            <span className="Type--secondary">⏎ View</span>
          </div>
        </div>
      )
    })

    if (viewedDocLinks.length > 0) {
      return (
        <div>
          <div className="ListMenu__segment">Boards</div>
          <div className="ListMenuSection">
            { viewedDocLinks }
          </div>
        </div>
      )
    }

    return null
  }

  renderDocLinksSection() {
    const docLinks = this.sectionItems('docUrls').map((item) => {
      const { url } = item
      const classes = item.selected ? 'ListMenu__item ListMenu__item--selected' : 'ListMenu__item'

      return (
        <div key={url} className={classes}>
          <i className="Badge ListMenu__thumbnail fa fa-files-o" />
          <div>
            <h4 className="Type--primary">Open Board</h4>
            <p className="Type--secondary">{url.slice(0, 50)}…</p>
          </div>

          <div className="ListMenu Actions">
            <span className="Type--secondary">⏎ Open</span>
          </div>
        </div>
      )
    })

    if (docLinks.length > 0) {
      return (
        <div className="ListMenuSection">
          { docLinks }
        </div>
      )
    }

    return null
  }

  renderContactsSection() {
    const contacts = this.sectionItems('contacts').map((item) => {
      const { url } = item
      const classes = item.selected ? 'ListMenu__item ListMenu__item--selected' : 'ListMenu__item'

      return (
        <div key={url} className={classes}>
          <Content context="list" url={url} />

          <div className="ListMenu Actions">
            <span className="Type--secondary">⏎ Invite</span>
          </div>
        </div>
      )
    })

    if (contacts.length > 0) {
      return (
        <div className="ListMenuSection">
          { contacts }
        </div>
      )
    }

    return null
  }

  render() {
    log('render')

    if (!this.props.visible) {
      return null
    }

    if (!this.state.currentDocUrl) {
      return null
    }

    return (
      <div className="Omnibox">
        <div className="ListMenu">
          { this.renderInvitationsSection() }
          { this.renderViewedDocLinksSection() }
          { this.renderDocLinksSection() }
          { this.renderContactsSection() }
        </div>
      </div>
    )
  }
}
