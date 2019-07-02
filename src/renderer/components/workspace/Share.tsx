import React from 'react'
import Debug from 'debug'

import Content from "../Content"

import { createDocumentLink, parseDocumentLink, HypermergeUrl } from '../../ShareLink'
import ListMenuItem from './ListMenuItem'
import { Doc as WorkspaceDoc } from "./Workspace"
import { Handle } from 'hypermerge';
import { ContactDoc } from '../contact';
// TODO: once board is converted use this import and remove the type definition below
// import { Doc as BoardDoc } from "../board"
type BoardDoc = any

const log = Debug('pushpin:share')

export interface Props {
  hypermergeUrl: HypermergeUrl
}

type TabName = 'contacts' | 'profile'

interface State {
  tab: TabName
  board?: BoardDoc
  workspace?: WorkspaceDoc
}

export default class Share extends React.PureComponent<Props, State> {
  state: State = { tab: 'contacts' }
  workspaceHandle?: Handle<WorkspaceDoc>
  boardHandle?: Handle<any>

  // This is the New Boilerplate
  componentWillMount = () => {
    this.refreshWorkspaceHandle(this.props.hypermergeUrl)
  }

  componentWillUnmount = () => {
    this.workspaceHandle && this.workspaceHandle.close()
    this.boardHandle && this.boardHandle.close()
  }

  componentDidUpdate = (prevProps: Props) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshWorkspaceHandle(this.props.hypermergeUrl)
    }
  }

  refreshWorkspaceHandle = (hypermergeUrl: HypermergeUrl) => {
    if (this.workspaceHandle) {
      this.workspaceHandle.close()
    }
    this.workspaceHandle = window.repo.watch(hypermergeUrl, (doc) => this.onWorkspaceChange(doc))
  }

  refreshBoardHandle = (boardUrl: HypermergeUrl) => {
    log('refreshBoardHandle')
    if (this.boardHandle) {
      this.boardHandle.close()
    }
    this.boardHandle = window.repo.watch(boardUrl, (doc) => this.onBoardChange(doc))
  }

  onBoardChange = (doc: BoardDoc) => {
    log('onBoardChange')
    this.setState({ board: doc })
  }

  onWorkspaceChange = (doc: WorkspaceDoc) => {
    log('onWorkspaceChange')
    this.setState({ workspace: doc }, () => {
      if (!this.state.workspace) return
      if (this.state.workspace.currentDocUrl) {
        const { hypermergeUrl } = parseDocumentLink(this.state.workspace.currentDocUrl)

        if (!this.state.board || this.state.board.hypermergeUrl !== hypermergeUrl) {
          this.refreshBoardHandle(hypermergeUrl)
        }
      }
    })
  }

  offerDocumentToIdentity = (contactId: string) => {
    if (!this.state.workspace || !this.state.workspace.selfId || !this.state.workspace.currentDocUrl) {
      return
    }


    log('offerDocumentToIdentity')

    const currentDocUrl = this.state.workspace.currentDocUrl
    window.repo.change(this.state.workspace.selfId, (s: ContactDoc) => {
      if (!s.offeredUrls) {
        s.offeredUrls = {}
      }

      if (!s.offeredUrls[contactId]) {
        s.offeredUrls[contactId] = []
      }

      if (!s.offeredUrls[contactId].includes(currentDocUrl)) {
        s.offeredUrls[contactId].push(currentDocUrl)
      }
    })
  }

  renderContacts = () => {
    const { contactIds = [] } = (this.state.workspace || {})
    const uniqueContactIds = contactIds.filter((id, i, a) => (a.indexOf(id) === i))
    const noneFound = (
      <div className="ListMenu__item">
        <div className="ContactListMenuItem">
          <i className="Badge ListMenu__thumbnail fa fa-question-circle" style={{ backgroundColor: 'var(--colorPaleGrey)' }} />
          <div className="Label">
            <p className="Type--primary">None found</p>
            <p className="Type--secondary">Copy a link to your board and start making friends</p>
          </div>
        </div>
      </div>
    )

    const share = {
      name: 'share',
      callback: (url: string) => () => this.offerDocumentToIdentity(url),
      faIcon: 'fa-share-alt',
      label: 'Share'
    }

    /* This doesn't make sense in a Pushpin world, I think.
       Once you've written a share offer into your history,
       anyone could go back and find it again.
       I'll leave it here for posterity for now.
    const unshare = {
      name: 'unshare',
      destructive: true,
      callback: (url) => (e) => this.revokeOfferDocumentToIdentity(url),
      faIcon: 'fa-ban',
      label: 'Unshare'
    }
    */

    const contacts = uniqueContactIds.map(id => (
      <ListMenuItem key={id} contentUrl={createDocumentLink('contact', id)} actions={[share]} />
    ))

    return (
      <div>
        <div className="ListMenu__section">
          {uniqueContactIds.length !== 0 ? contacts : noneFound}
        </div>
      </div>
    )
  }

  renderProfile = () => {
    if (!this.state.workspace) return null
    return <Content url={createDocumentLink('contact', this.state.workspace.selfId)} context="workspace"></Content>
  }

  tabClasses = (name: TabName) => {
    if (this.state.tab === name) { return 'Tabs__tab Tabs__tab--active' }
    return 'Tabs__tab'
  }

  render = () => {
    let body: JSX.Element | null = null
    if (this.state.tab === 'profile') {
      body = this.renderProfile()
    } else if (this.state.tab === 'contacts') {
      body = this.renderContacts()
    }

    return (
      <div className="PopOverWrapper">
        <div className="ListMenu">
          <div className="Tabs">
            <div
              role="button"
              className={this.tabClasses('contacts')}
              onClick={() => this.setState({ tab: 'contacts' })}
            >
              <i className="fa fa-group" /> All Contacts
            </div>
            <div
              role="button"
              className={this.tabClasses('profile')}
              onClick={() => this.setState({ tab: 'profile' })}
            >
              <i className="fa fa-pencil" /> Profile
            </div>
          </div>
          {body}
        </div>
      </div>
    )
  }
}
