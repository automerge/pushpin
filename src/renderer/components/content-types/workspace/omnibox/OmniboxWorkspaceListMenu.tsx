/* eslint-disable react/sort-comp */
// this component has a bunch of weird pseudo-members that make eslint sad

import React from 'react'
import Debug from 'debug'

import { Handle, Doc, DocUrl } from 'hypermerge'

import {
  createDocumentLink,
  parseDocumentLink,
  HypermergeUrl,
  PushpinUrl,
} from '../../../../ShareLink'

import InvitationsView from '../../../../InvitationsView'
import { ContactDoc } from '../../contact'
import Badge from '../../../Badge'
import Text from '../../../Text'
import './Omnibox.css'
import InvitationListItem from './InvitationListItem'
import ListMenuSection from '../../../ListMenuSection'
import ListMenuItem from '../../../ListMenuItem'
import ListMenu from '../../../ListMenu'
import OmniboxWorkspaceListMenuSection from './OmniboxWorkspaceListMenuSection'
import { Doc as WorkspaceDoc } from '../Workspace'

import './OmniboxWorkspaceListMenu.css'

const log = Debug('pushpin:omnibox')

export interface Props {
  active: boolean
  search: string
  hypermergeUrl: DocUrl
  omniboxFinished: Function
  onContent: (url: PushpinUrl) => boolean
}

interface State {
  selectedIndex: number
  invitations: any[]
  viewedDocs: { [docUrl: string]: any } // PushpinUrl
  contacts: { [contactId: string]: ContactDoc } // HypermergeUrl
  doc?: Doc<WorkspaceDoc>
}

interface SectionIndex {
  [sectionName: string]: SectionRange
}

interface SectionRange {
  start: number
  end: number
}

interface Section {
  name: string
  label?: string
  actions: Action[]
  items: (state: State, props: Props) => Item[]
}

export interface Item {
  type?: string
  object?: any
  url?: PushpinUrl
  selected?: boolean
  actions?: Action[]
}

export interface Action {
  name: string
  callback: (url: any) => () => void
  faIcon: string
  label: string
  shortcut: string
  keysForActionPressed: (e: any) => boolean
}

export default class OmniboxWorkspaceListMenu extends React.PureComponent<Props, State> {
  omniboxInput = React.createRef<HTMLInputElement>()
  handle?: Handle<WorkspaceDoc>
  viewedDocHandles: { [docUrl: string]: Handle<any> }
  contactHandles: { [contactId: string]: Handle<ContactDoc> }
  invitationsView: any

  state: State = {
    selectedIndex: 0,
    invitations: [],
    viewedDocs: {},
    contacts: {},
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
    this.invitationsView = new InvitationsView(
      window.repo,
      this.props.hypermergeUrl,
      this.onInvitationsChange
    )
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
    this.handle && this.handle.close()
    document.removeEventListener('keydown', this.handleCommandKeys)

    Object.values(this.viewedDocHandles).forEach((handle) => handle.close())
    Object.values(this.contactHandles).forEach((handle) => handle.close())
  }

  componentDidUpdate = (prevProps: Props) => {
    log('componentDidUpdate')
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshHandle = (hypermergeUrl: HypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }

  onInvitationsChange = (invitations: any) => {
    log('invitations change')
    this.setState({ invitations }, () => this.forceUpdate())
  }

  onChange = (doc: Doc<WorkspaceDoc>) => {
    log('onChange', doc)
    this.setState({ doc }, () => {
      this.state.doc &&
        this.state.doc.viewedDocUrls.forEach((url) => {
          // create a handle for this document
          if (!this.viewedDocHandles[url]) {
            const { hypermergeUrl } = parseDocumentLink(url)
            // when it changes, stick the contents of the document
            // into this.state.viewedDocs[url]
            const handle = window.repo.watch(hypermergeUrl, (doc) => {
              this.setState((state) => {
                return { viewedDocs: { ...state.viewedDocs, [url]: doc } }
              })
            })
            this.viewedDocHandles[url] = handle
          }
        })

      this.state.doc &&
        this.state.doc.contactIds.forEach((contactId) => {
          // create a handle for each contact
          if (!this.contactHandles[contactId]) {
            // when it changes, put it into this.state.contacts[contactId]

            const handle = window.repo.watch(
              (contactId as unknown) as HypermergeUrl, // XXX: this is... wrong?
              (doc: ContactDoc) => {
                this.setState((state) => {
                  return { contacts: { ...state.contacts, [contactId]: doc } }
                })
              }
            )
            this.contactHandles[contactId] = handle
          }
        })
    })
  }

  endSession = () => {
    this.props.omniboxFinished()
  }

  handleCommandKeys = (e: KeyboardEvent) => {
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
    if (selected.actions) {
      selected.actions.forEach((action) => {
        if (action.keysForActionPressed(e)) {
          action.callback(selected.url)()
          this.endSession()
        }
      })
    }
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

    if (selectedIndex < items.length - 1) {
      this.setState({ selectedIndex: selectedIndex + 1 })
    }
  }

  menuSections = (): { items: Item[]; sectionIndices: SectionIndex } => {
    const { doc } = this.state
    if (!doc) {
      return { items: [], sectionIndices: {} }
    }

    let items: Item[] = []
    const sectionIndices: { [section: string]: SectionRange } = {}
    const { search } = this.props

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
      .filter((i) => !doc.viewedDocUrls.some((url) => url === i.documentUrl))
      .filter((invitation) => (invitation.doc.title || 'Loading...').match(searchRegEx))
      .map((invitation) => ({
        type: 'invitation',
        object: invitation,
        url: invitation.documentUrl,
        actions: [this.view],
      }))

    sectionIndices.invitations = { start: items.length, end: invitationItems.length }
    items = items.concat(invitationItems)

    // add each section definition's items to the output
    this.sectionDefinitions.forEach((sectionDefinition) => {
      // this is really, really not my favorite thing
      const sectionItems = sectionDefinition.items!(this.state, this.props)
      // don't tell my mom about this next line
      sectionItems.forEach((item) => {
        item.actions = sectionDefinition.actions
      })
      if (sectionItems.length > 0) {
        sectionIndices[sectionDefinition.name] = {
          start: items.length,
          end: items.length + sectionItems.length,
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
    const sectionRange = sectionIndices[name]

    if (sectionRange) {
      return items.slice(sectionRange.start, sectionRange.end)
    }

    return []
  }

  /* begin actions */
  view = {
    name: 'view',
    faIcon: 'fa-compass',
    label: 'View',
    shortcut: '⏎',
    keysForActionPressed: (e) => !e.shiftKey && e.key === 'Enter',
    callback: (url) => () => this.navigate(url),
  }

  invite = {
    name: 'invite',
    faIcon: 'fa-share-alt',
    label: 'Invite',
    shortcut: '⏎',
    keysForActionPressed: (e) => !e.shiftKey && e.key === 'Enter',
    callback: (url) => () => this.offerDocumentToIdentity(url),
  }

  archive = {
    name: 'archive',
    destructive: true,
    faIcon: 'fa-trash',
    label: 'Archive',
    shortcut: '⌘+⌫',
    keysForActionPressed: (e) => (e.metaKey || e.ctrlKey) && e.key === 'Backspace',
    callback: (url) => () => this.archiveDocument(url),
  }

  unarchive = {
    name: 'unarchive',
    faIcon: 'fa-trash-restore',
    label: 'Unarchive',
    shortcut: '⌘+⌫',
    keysForActionPressed: (e) => (e.metaKey || e.ctrlKey) && e.key === 'Backspace',
    callback: (url) => () => this.unarchiveDocument(url),
  }

  place = {
    name: 'place',
    faIcon: 'fa-download',
    label: 'Place',
    shortcut: '⇧+⏎',
    keysForActionPressed: (e) => e.shiftKey && e.key === 'Enter',
    callback: (url) => () => {
      this.props.onContent(url)
    },
  }

  /* end actions */

  /* sections begin */
  sectionDefinitions: Section[] = [
    {
      name: 'viewedDocUrls',
      label: 'Documents',
      actions: [this.view, this.place, this.archive],
      items: (state, props) =>
        Object.entries(this.state.viewedDocs)
          .filter(
            ([url, _doc]) =>
              !state.doc ||
              !state.doc.archivedDocUrls ||
              !state.doc.archivedDocUrls.includes(url as PushpinUrl)
          )
          .filter(
            ([_url, doc]) =>
              doc &&
              ((doc.title && doc.title.match(new RegExp(props.search, 'i'))) ||
                ((doc.text && doc.text.join('').match(new RegExp(props.search, 'i'))) ||
                  (doc.data &&
                    doc.data.text &&
                    doc.data.text.match(new RegExp(props.search, 'i')))))
          )
          .map(([url, _doc]) => ({ url: url as PushpinUrl })),
    },
    {
      name: 'archivedDocUrls',
      label: 'Archived',
      actions: [this.view, this.unarchive],
      items: (state, props) =>
        props.search === '' || !state.doc
          ? [] // don't show archived URLs unless there's a current search term
          : (state.doc.archivedDocUrls || [])
              .map((url) => [url, this.state.viewedDocs[url]])
              .filter(
                ([_url, doc]) => doc && doc.title && doc.title.match(new RegExp(props.search, 'i'))
              )
              .map(([url, doc]) => ({ url })),
    },
    {
      name: 'docUrls',
      actions: [this.view],
      items: (state, props) => {
        // try parsing the "search" to see if it is a valid document URL
        try {
          parseDocumentLink(props.search)
          return [{ url: props.search as PushpinUrl }]
        } catch {
          return []
        }
      },
    },
    {
      name: 'contacts',
      label: 'Contacts',
      actions: [this.invite, this.place, this.archive],
      items: (state, props) =>
        Object.entries(this.state.contacts)
          .filter(([id, doc]) => doc.name)
          .filter(([id, doc]) => doc.name.match(new RegExp(props.search, 'i')))
          .map(([id, doc]) => ({ url: createDocumentLink('contact', id as HypermergeUrl) })),
    },
  ]
  /* end sections */

  navigate = (url) => {
    window.location = url
    this.props.omniboxFinished()
  }

  offerDocumentToIdentity = (contactUrl) => {
    // XXX out of scope RN but consider if we should change the key for consistency?
    const { type, hypermergeUrl } = parseDocumentLink(contactUrl)
    const { doc } = this.state

    if (!doc || !doc.selfId) {
      return
    }

    if (type !== 'contact') {
      throw new Error(
        'Offer the current document to a contact by passing in the contact id document.'
      )
    }

    window.repo.change(doc.selfId, (s: ContactDoc) => {
      if (!s.offeredUrls) {
        s.offeredUrls = {}
      }

      // XXX right now this code leaks identity documents and document URLs to
      //     every single person who knows you
      if (!s.offeredUrls[hypermergeUrl]) {
        s.offeredUrls[hypermergeUrl] = []
      }

      if (!s.offeredUrls[hypermergeUrl].includes(doc.currentDocUrl)) {
        s.offeredUrls[hypermergeUrl].push(doc.currentDocUrl)
      }
    })
  }

  archiveDocument = (url) => {
    this.handle &&
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
    this.handle &&
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
      return (
        <ListMenuSection title="Oops..." key="nothingFound">
          <ListMenuItem>
            <div className="Omnibox-nothingFound">
              <span className="Omnibox-nothingFoundBadge">
                <Badge icon="question-circle" backgroundColor="var(--colorPaleGrey)" />
              </span>
              <Text>Nothing Found</Text>
            </div>
          </ListMenuItem>
        </ListMenuSection>
      )
    }
    return null
  }

  renderInvitationsSection = () => {
    const invitations = this.sectionItems('invitations').map((item) => {
      const invitation = item.object

      // XXX: it seems to me that we should register an invitation as a kind of unlisted "type"
      //      and make this a list context renderer for that type
      // ... i'm not really sure how we ought approach that
      return (
        <InvitationListItem
          invitation={invitation}
          key={`${invitation.sender.hypermergeUrl}-${invitation.documentUrl}`}
          selected={item.selected}
        />
      )
    })

    if (invitations.length > 0) {
      return (
        <ListMenuSection title="Invitations" key="invitations">
          {invitations}
        </ListMenuSection>
      )
    }

    return null
  }

  render = () => {
    if (!this.state.doc) {
      return null
    }

    if (!this.props.hypermergeUrl) {
      return null
    }

    return (
      <ListMenu>
        {this.renderInvitationsSection()}
        {this.sectionDefinitions.map(({ name, label, actions }) => (
          <OmniboxWorkspaceListMenuSection
            key={name}
            name={name}
            label={label}
            actions={actions}
            items={this.sectionItems(name)}
          />
        ))}
        {this.renderNothingFound()}
      </ListMenu>
    )
  }
}
