import React from 'react'
import Debug from 'debug'
import PropTypes from 'prop-types'

import OmniItem from './list-item'

import { createDocumentLink, parseDocumentLink } from '../../share-link'

const log = Debug('pushpin:omnibox')

export default class Omnibox extends React.PureComponent {
  static propTypes = {
    // this seems silly, but the omnibox maintains a lot of in-memory state
    // so we keep it around even when it isn't visible
    visible: PropTypes.bool.isRequired,
    search: PropTypes.string,
    invitations: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    hypermergeUrl: PropTypes.string.isRequired,
    omniboxFinished: PropTypes.func.isRequired,
  }

  static defaultProps = {
    search: ''
  }

  constructor(props) {
    super(props)
    this.state = { selectedIndex: 0, viewedDocs: {}, contacts: {} }
    this.viewedDocHandles = {}
    this.contactHandles = {}
  }

  componentDidMount = () => {
    log('componentDidMount')
    this.refreshHandle(this.props.hypermergeUrl)
    document.addEventListener('keydown', this.handleCommandKeys)
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
    this.handle.close()
    document.removeEventListener('keydown', this.handleCommandKeys)

    Object.values(this.viewedDocHandles).forEach(handle => handle.close())
    Object.values(this.contactHandles).forEach(handle => handle.close())
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    log('componentDidUpdate')
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }

    if ((this.props.visible && !prevProps.visible)
      || (this.props.search !== prevProps.search)) {
      this.setSelectedIndex(0)
    }
  }

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }


  onChange = (doc) => {
    log('onChange', doc)
    this.setState({ ...doc }, () => {
      this.state.viewedDocUrls.forEach(url => {
        // create a handle for this document
        if (!this.viewedDocHandles[url]) {
          const { hypermergeUrl } = parseDocumentLink(url)
          // when it changes, stick the contents of the document
          // into this.state.viewedDocs[url]
          const handle = window.repo.watch(hypermergeUrl, (doc) => {
            this.setState((state, props) => {
              const { viewedDocs } = state
              viewedDocs[url] = doc
              return { viewedDocs }
            })
          })
          this.viewedDocHandles[url] = handle
        }
      })

      this.state.contactIds.forEach(contactId => {
        // create a handle for each contact
        if (!this.contactHandles[contactId]) {
          // when it changes, put it into this.state.contacts[contactId]
          const handle = window.repo.watch(contactId, (doc) => {
            this.setState((state, props) => {
              const { contacts } = state
              contacts[contactId] = doc
              return { contacts }
            })
          })
          this.contactHandles[contactId] = handle
        }
      })
    })
  }


  handleCommandKeys = (e) => {
    // XXX: this is left-over mess that used to be in omni-prompt
    const { selectedIndex } = this.state
    const { items } = this.menuSections()
    const selected = items[selectedIndex]

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      this.moveDown()
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      this.moveUp()
    }

    if (e.key === 'Enter') {
      e.preventDefault()

      if (selected) {
        this.resolveDocumentSelection(selected)
      }

      this.props.omniboxFinished()
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
      e.preventDefault()

      if (!selected) {
        return
      }
      const { url, type } = selected
      if (type === 'viewedDocUrl') {
        this.archiveDocument(url)
      }
    }
  }

  resolveDocumentSelection = (selected) => {
    switch (selected.type) {
      case 'contact':
        this.offerDocumentToIdentity(this.state.selected.id)
        break
      default:
        if (selected.url) {
          this.navigate(selected.url)
        }
    }
  }

  setSelectedIndex = (newIndex) => {
    this.setState({ selectedIndex: newIndex })
  }

  moveUp = () => {
    const { selectedIndex } = this.state

    if (selectedIndex > 0) {
      this.setSelectedIndex(selectedIndex - 1)
    }
  }

  moveDown = () => {
    const { items } = this.menuSections()
    const { selectedIndex } = this.state

    if (selectedIndex < (items.length - 1)) {
      this.setSelectedIndex(selectedIndex + 1)
    }
  }

  menuSections = () => {
    let items = []
    const sectionIndices = {}
    const { search } = this.props
    const { archivedDocUrls = [] } = this.state

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

    let searchRegEx
    try {
      searchRegEx = new RegExp(search, 'i')
    } catch (e) {
      items.push({ type: 'nothingFound' })
      sectionIndices.nothingFound = { start: 0, end: 1 }
      return { items, sectionIndices }
    }

    // Note: The order of sections built here needs to match the rendered order
    const invitationItems = this.props.invitations
      .filter(invitation => (invitation.doc.title || 'Loading...').match(searchRegEx))
      .map(invitation => ({ type: 'invitation', object: invitation, url: invitation.documentUrl }))

    sectionIndices.invitations = { start: items.length, end: invitationItems.length }
    items = items.concat(invitationItems)

    const viewedDocItems = Object.entries(this.state.viewedDocs)
      .filter(([url, doc]) => !archivedDocUrls.includes(url))
      .filter(([url, doc]) => (parseDocumentLink(url).type === 'board'))
      .filter(([url, doc]) => doc.title.match(searchRegEx))
      .map(([url, doc]) => ({ type: 'viewedDocUrl', object: doc, url }))

    sectionIndices.viewedDocUrls = {
      start: items.length,
      end: items.length + viewedDocItems.length
    }
    items = items.concat(viewedDocItems)

    if (search.length > 0) {
      const archivedDocItems = archivedDocUrls.map(url => [url, this.state.viewedDocs[url]])
        .filter(([url, doc]) => (parseDocumentLink(url).type === 'board'))
        .filter(([url, doc]) => doc.title.match(new RegExp(search, 'i')))
        .map(([url, doc]) => ({ type: 'archivedDocUrl', object: doc, url }))

      sectionIndices.archivedDocUrls = {
        start: items.length,
        end: items.length + archivedDocItems.length
      }
      items = items.concat(archivedDocItems)

      const contactItems = Object.entries(this.state.contacts)
        .filter(([id, doc]) => doc.name)
        .filter(([id, doc]) => doc.name.match(searchRegEx))
        .map(([id, doc]) => ({ type: 'contact', object: doc, id, url: createDocumentLink('contact', id) }))

      sectionIndices.contacts = { start: items.length, end: (items.length + contactItems.length) }
      items = items.concat(contactItems)
    }

    if (items.length === 0) {
      items.push({ type: 'nothingFound' })
      sectionIndices.nothingFound = { start: 0, end: 1 }
    }

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

  renderNothingFound = () => {
    const item = this.sectionItems('nothingFound')[0]

    if (item) {
      const classes = item.selected ? 'ListMenu__item DocLink ListMenu__item--selected NothingFound' : 'NothingFound ListMenu__item'

      return (
        <div>
          <div className="ListMenu__segment">
            Oops…
          </div>
          <div className="ListMenu__section">
            <div className={classes} key="nothingFound">
              <i className="Badge ListMenu__thumbnail fa fa-question-circle" style={{ backgroundColor: 'var(--colorPaleGrey)' }} />
              <p className="Type--primary">Nothing Found</p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  renderInvitationsSection = () => {
    const invitations = this.sectionItems('invitations').map((item) => {
      const invitation = item.object
      const classes = item.selected ? 'ListMenu__item ListMenu__item--selected' : 'ListMenu__item'

      return (
        <div key={`${invitation.sender.hypermergeUrl}-${invitation.documentUrl}`} className={classes}>
          <div className="Invitation">
            <i className="Badge fa fa-envelope" style={{ background: invitation.doc && invitation.doc.backgroundColor }} />
            <div className="Invitation__body">
              <h4 className="Type--primary">{invitation.doc.title || 'Untitled'}</h4>
              <p className="Type--secondary">From {invitation.sender.name}</p>
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
          <div className="ListMenu__section">
            {invitations}
          </div>
        </div>
      )
    }

    return null
  }

  renderContentSection = ({ name, label, actions }) => {
    const items = this.sectionItems(name).map((item) => {
      const { url, selected } = item
      return <OmniItem key={url} contentUrl={url} actions={actions} selected={selected} />
    })

    if (items.length > 0) {
      const labelPartial = label ? <div className="ListMenu__segment">{label}</div> : null

      return (
        <div>
          {labelPartial}
          <div className="ListMenu__section">
            {items}
          </div>
        </div>
      )
    }

    return null
  }

  /* begin actions */
  view = {
    name: 'view',
    callback: (url) => () => this.navigate(url),
    faIcon: 'fa-compass',
    label: 'View',
    shortcut: '⏎'
  }

  invite = {
    name: 'invite',
    callback: (url) => (e) => this.offerDocumentToIdentity(url),
    faIcon: 'fa-compass',
    label: 'Invite',
    shortcut: '⏎'
  }

  archive = {
    name: 'archive',
    destructive: true,
    callback: (url) => () => this.archiveDocument(url),
    faIcon: 'fa-trash',
    label: 'Archive',
    shortcut: '⌘+⌫'
  }

  unarchive = {
    name: 'unarchive',
    callback: (url) => (e) => this.unarchiveDocument(url),
    faIcon: 'fa-trash-restore',
    label: 'Unarchive',
    shortcut: '⌘+⌫'
  }
  /* end actions */

  /* sections begin */
  sectionDefinitions = [
    {
      name: 'viewedDocUrls',
      label: 'Boards',
      actions: [this.view, this.archive]
    },
    {
      name: 'archivedDocUrls',
      label: 'Archived',
      actions: [this.view, this.unarchive]
    },
    {
      name: 'docUrls',
      actions: [this.view]
    },
    {
      name: 'contacts',
      label: 'Contacts',
      actions: [this.invite]
    }
  ]

  /* end sections */

  navigate = (url) => {
    window.location = url
  }

  offerDocumentToIdentity = (contactUrl) => {
    // XXX out of scope RN but consider if we should change the key for consistency?
    const { type, id } = parseDocumentLink(contactUrl)
    if (type !== 'contact') {
      throw (new Error('Offer the current document to a contact by passing in the contact id document.'))
    }

    if (!this.state.selfId) {
      return
    }

    window.repo.change(this.state.selfId, (s) => {
      if (!s.offeredUrls) {
        s.offeredUrls = {}
      }

      // XXX right now this code leaks identity documents and document URLs to
      //     every single person who knows you
      if (!s.offeredUrls[id]) {
        s.offeredUrls[id] = []
      }

      if (!s.offeredUrls[id].includes(this.state.currentDocUrl)) {
        s.offeredUrls[id].push(this.state.currentDocUrl)
      }
    })
  }

  archiveDocument = (url) => {
    this.handle.change((doc) => {
      if (!doc.archivedDocUrls) {
        doc.archivedDocUrls = []
      }

      if (!doc.archivedDocUrls.includes(url)) {
        doc.archivedDocUrls.push(url)
      }
    })
  }

  unarchiveDocument = (url) => {

  }

  render = () => {
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
          {this.renderInvitationsSection()}
          {this.sectionDefinitions.map(
            (sectionDefinition) => this.renderContentSection(sectionDefinition)
          )}
          {this.renderNothingFound()}
        </div>
      </div>
    )
  }
}
