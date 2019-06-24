import React from 'react'
import Debug from 'debug'
import PropTypes from 'prop-types'

import ContentSection from './content-section'

import { createDocumentLink, parseDocumentLink } from '../../share-link'

import InvitationsView from '../../invitations-view'

const log = Debug('pushpin:omnibox')

export default class Omnibox extends React.PureComponent {
  static propTypes = {
    active: PropTypes.bool.isRequired,
    hypermergeUrl: PropTypes.string.isRequired,
    omniboxFinished: PropTypes.func.isRequired
  }

  omniboxInput = React.createRef()

  state = {
    search: '',
    selectedIndex: 0,
    invitations: [],
    viewedDocs: {},
    contacts: {},
    archivedDocUrls: []
  }

  constructor(props) {
    super(props)
    this.viewedDocHandles = {}
    this.contactHandles = {}
  }

  componentDidMount = () => {
    log('componentDidMount')
    this.refreshHandle(this.props.hypermergeUrl)
    document.addEventListener('keydown', this.handleCommandKeys)
    this.invitationsView = new InvitationsView(this.props.hypermergeUrl)
    this.invitationsView.onChange(this.onInvitationsChange)
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

    if (!prevProps.active && this.props.active) {
      this.setState({ search: '' }, () => {
        setTimeout(() => this.omniboxInput.current.focus(), 0)
      })
    }
  }

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }

  onInvitationsChange = (invitations) => {
    log('invitations change')
    this.setState({ invitations }, () => this.forceUpdate())
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

  endSession = () => {
    this.props.omniboxFinished()
  }

  handleCommandKeys = (e) => {
    // XXX hmmmmm, this could be cleaner
    if (!this.props.active) {
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      this.moveDown()
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      this.moveUp()
    }

    const { selectedIndex } = this.state
    const { items } = this.menuSections()
    const selected = items[selectedIndex]
    if (!selected) {
      return
    }

    // see if any of the actions for the currently selected item are triggered by the keypress
    // XXX: we might want to use the mousetrap library for this
    selected.actions.forEach((action) => {
      if (action.keysForActionPressed(e)) {
        action.callback(selected.url)()
        this.endSession()
      }
    })
  }

  setSelection = (newIndex) => {
    this.setState({ selectedIndex: newIndex })
  }

  moveUp = () => {
    const { selectedIndex } = this.state

    if (selectedIndex > 0) {
      this.setState({ selectedIndex: selectedIndex - 1 })
    }
  }

  moveDown = () => {
    const { items } = this.menuSections()
    const { selectedIndex } = this.state

    if (selectedIndex < (items.length - 1)) {
      this.setState({ selectedIndex: selectedIndex + 1 })
    }
  }

  onInputChange = (e) => {
    this.setState({ search: e.target.value, selectedIndex: 0 })
  }

  menuSections = () => {
    let items = []
    const sectionIndices = {}
    const { search } = this.state

    let searchRegEx
    // if we have an invalid regex, shortcircuit out of here
    try {
      searchRegEx = new RegExp(search, 'i')
    } catch (e) {
      items.push({ type: 'nothingFound', actions: [] })
      sectionIndices.nothingFound = { start: 0, end: 1 }
      return { items, sectionIndices }
    }

    // invitations are sort of a pseudo-section right now with lots of weird behaviour
    const invitationItems = (this.state.invitations || [])
      .filter((i) => (!this.state.viewedDocUrls.some(url => url === i.documentUrl)))
      .filter(invitation => (invitation.doc.title || 'Loading...').match(searchRegEx))
      .map(invitation => ({ type: 'invitation', object: invitation, url: invitation.documentUrl, actions: [this.view] }))

    sectionIndices.invitations = { start: items.length, end: invitationItems.length }
    items = items.concat(invitationItems)

    // add each section definition's items to the output
    this.sectionDefinitions.forEach((sectionDefinition) => {
      // this is really, really not my favorite thing
      const sectionItems = sectionDefinition.items(this.state, this.props)
      // don't tell my mom about this next line
      sectionItems.forEach(item => { item.actions = sectionDefinition.actions })
      if (sectionItems.length > 0) {
        sectionIndices[sectionDefinition.name] = {
          start: items.length,
          end: items.length + sectionItems.length
        }
        items = items.concat(sectionItems)
      }
    })

    // if after putting all the sections together, we still don't have anything,
    // just put in an "empty results" pseudosection
    // we could, uh, do better here too
    if (items.length === 0) {
      items.push({ type: 'nothingFound', actions: [] })
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

  /* begin actions */
  view = {
    name: 'view',
    callback: (url) => () => this.navigate(url),
    faIcon: 'fa-compass',
    label: 'View',
    shortcut: '⏎',
    keysForActionPressed: (e) => (e.key === 'Enter')
  }

  invite = {
    name: 'invite',
    callback: (url) => (e) => this.offerDocumentToIdentity(url),
    faIcon: 'fa-share-alt',
    label: 'Invite',
    shortcut: '⏎',
    keysForActionPressed: (e) => (e.key === 'Enter')
  }

  archive = {
    name: 'archive',
    destructive: true,
    callback: (url) => () => this.archiveDocument(url),
    faIcon: 'fa-trash',
    label: 'Archive',
    shortcut: '⌘+⌫',
    keysForActionPressed: (e) => ((e.metaKey || e.ctrlKey) && e.key === 'Backspace')

  }

  unarchive = {
    name: 'unarchive',
    callback: (url) => (e) => this.unarchiveDocument(url),
    faIcon: 'fa-trash-restore',
    label: 'Unarchive',
    shortcut: '⌘+⌫',
    keysForActionPressed: (e) => ((e.metaKey || e.ctrlKey) && e.key === 'Backspace')
  }
  /* end actions */

  /* sections begin */
  sectionDefinitions = [
    {
      name: 'viewedDocUrls',
      label: 'Boards',
      actions: [this.view, this.archive],
      items: (state, props) => Object.entries(this.state.viewedDocs)
        .filter(([url, doc]) => !state.archivedDocUrls.includes(url))
        .filter(([url, doc]) => (parseDocumentLink(url).type === 'board'))
        .filter(([url, doc]) => doc && doc.title.match(new RegExp(state.search, 'i')))
        .map(([url, doc]) => ({ url }))
    },
    {
      name: 'archivedDocUrls',
      label: 'Archived',
      actions: [this.view, this.unarchive],
      items: (state, props) => ((state.search === '')
        ? [] // don't show archived URLs unless there's a current search term
        : state.archivedDocUrls.map(url => [url, this.state.viewedDocs[url]])
          .filter(([url, doc]) => (parseDocumentLink(url).type === 'board'))
          .filter(([url, doc]) => doc && doc.title.match(new RegExp(state.search, 'i')))
          .map(([url, doc]) => ({ url })))

    },
    {
      name: 'docUrls',
      actions: [this.view],
      items: (state, props) => {
        // try parsing the "search" to see if it is a valid document URL
        try {
          parseDocumentLink(state.search)
          return [{ url: state.search }]
        } catch {
          return []
        }
      }
    },
    {
      name: 'contacts',
      label: 'Contacts',
      actions: [this.invite],
      items: (state, props) => Object.entries(this.state.contacts)
        .filter(([id, doc]) => doc.name)
        .filter(([id, doc]) => doc.name.match(new RegExp(state.search, 'i')))
        .map(([id, doc]) => ({ url: createDocumentLink('contact', id) }))
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
    this.handle.change((doc) => {
      if (!doc.archivedDocUrls) {
        return
      }
      const unarchiveIndex = doc.archivedDocUrls.findIndex((i) => i === url)
      if (unarchiveIndex >= 0) {
        delete doc.archivedDocUrls[unarchiveIndex]
      }
    })
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

      // XXX: it seems to me that we should register an invitation as a kind of unlisted "type"
      //      and make this a list context renderer for that type
      // ... i'm not really sure how we ought approach that
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
    const items = this.sectionItems(name)

    if (items.length === 0) {
      return null
    }
    return (
      <ContentSection
        key={name}
        name={name}
        label={label}
        actions={actions}
        items={items}
      />
    )
  }

  render = () => {
    log('render')

    if (!this.state.currentDocUrl) {
      return null
    }

    return (
      <div className="Omnibox">
        <input
          type="text"
          ref={this.omniboxInput}
          style={css.omniboxInput}
          onChange={this.onInputChange}
          value={this.state.search}
          placeholder="Search..."
        />
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

const css = {
  omniboxInput: {
    fontSize: '18px',
    color: 'var(--colorBlueBlack)',
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    background: 'var(--colorInputGrey)',
    border: '0px',
    outline: 'none',
    borderRadius: '4px',
    margin: '4px',
    height: '24px',
    lineHeight: '24px'
  }
}
