import React from 'react'
import Debug from 'debug'
import PropTypes from 'prop-types'

import Content from './content'
import ContentTypes from '../content-types'
import { createDocumentLink, parseDocumentLink } from '../share-link'

const log = Debug('pushpin:omnibox')

export default class Omnibox extends React.PureComponent {
  static propTypes = {
    visible: PropTypes.bool.isRequired,
    search: PropTypes.string,
    move: PropTypes.string,
    getKeyController: PropTypes.func,
    invitations: PropTypes.arrayOf({}).isRequired
  }

  static defaultProps = {
    search: ''
  }

  constructor(props) {
    super(props)
    this.state = { selectedIndex: -1, viewedDocs: [], contacts: [] }
    this.viewedDocHandles = []
    this.contactHandles = []
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
    this.viewedDocHandles.forEach(handle => window.hm.releaseHandle(handle))
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
        if (!this.state.viewedDocs.find(({url: u}) => u === url)) {
          const { docId } = parseDocumentLink(url)
          const handle = window.hm.openHandle(docId)
          this.viewedDocHandles.push(handle)
          handle.onChange((doc) => {
            const viewedDocs = [ ...this.state.viewedDocs, { url, doc } ]
            this.setState({ viewedDocs })
          })
        }
      })

      this.state.contactIds.forEach(id => {
        if (!this.state.contacts.find(({i: id}) => i === id)) {
          const handle = window.hm.openHandle(id)
          this.contactHandles.push(handle)
          handle.onChange((doc) => {
            const contacts = [ ...this.state.contacts, { id, doc } ]
            this.setState({ contacts })
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
    const { items, sectionIndices } = this.menuSections()
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
      let { docId, type } = parseDocumentLink(search)
      items.push({ type: 'docUrl', object: search, url: search })
      sectionIndices.docUrls = { start: 0 }

      if (items[this.state.selectedIndex]) {
        items[this.state.selectedIndex].selected = true
      }

      return { items, sectionIndices }
    } catch (e) { }

    const invitationItems = this.props.invitations.
      filter(invitation => invitation.doc.title.match(new RegExp(search, 'i'))).
      map(invitation => ({ type: 'invitation', object: invitation, url: invitation.documentUrl }))

    sectionIndices.invitations = { start: items.length, end: invitationItems.length }
    items = items.concat(invitationItems)

    const state = this.state

    if (search.length > 0) {
      const contactItems = this.state.contacts.
        filter(({doc}) => doc.name).
        filter(({doc}) => doc.name.match(new RegExp(search, 'i'))).
        map(contact => ({ type: 'contact', object: contact }))

      sectionIndices.contacts = { start: items.length, end: (items.length + contactItems.length) }
      items = items.concat(contactItems)
    }

    const viewedDocItems = this.state.viewedDocs.
      filter(({url}) => (parseDocumentLink(url).type === 'board')).
      filter(({doc, url}) => {
        return doc.title.match(new RegExp(search, 'i'))
      }).
      map(object  => ({ type: 'viewedDocUrl', object, url: object.url }))

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
  }

  renderViewedDocLinksSection() {
    const viewedDocLinks = this.sectionItems('viewedDocUrls').map((item) => {
      const { url } = item.object
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
  }

  renderDocLinksSection() {
    const docLinks = this.sectionItems('docUrls').map((item) => {
      const url = item.object
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
  }

  renderContactsSection() {
    const contacts = this.sectionItems('contacts').map((item) => {
      const url = createDocumentLink('contact', item.object.id)
      const classes = item.selected ? 'ListMenu__item ListMenu__item--selected' : 'ListMenu__item'

      return (
        <div key={url} className={classes}>
          <Content url={url} />

          <div className="ListMenu Actions">
            <span className="Type--secondary">⏎ Open</span>
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
  }

  render() {
    log('render', this.state)

    if (!this.props.visible) {
      return null
    }

    if (!this.state.currentDocUrl) {
      return null
    }

    return <div className="Omnibox">
      <div className="ListMenu">
        { this.renderInvitationsSection() }
        { this.renderViewedDocLinksSection() }
        { this.renderDocLinksSection() }
        { this.renderContactsSection() }
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
