import React, { useState } from 'react'
import Debug from 'debug'
import classnames from 'classnames'

import Content from '../Content'
import Popover from '../Popover'

import { createDocumentLink, HypermergeUrl } from '../../ShareLink'
import ListMenuItem from './ListMenuItem'
import { Doc as WorkspaceDoc } from './Workspace'
import { ContactDoc } from '../contact'
import Label from '../Label'
import Badge from '../Badge'
import { useDocument, useRepo } from '../../Hooks'

const log = Debug('pushpin:share')

export interface Props {
  hypermergeUrl: HypermergeUrl
}

type TabName = 'contacts' | 'profile'

export default function Share(props: Props) {
  const repo = useRepo()
  const [tab, setTab] = useState<TabName>('contacts')
  const [workspace] = useDocument<WorkspaceDoc>(props.hypermergeUrl)

  if (!workspace) {
    return null
  }

  function offerDocumentToIdentity(contactId: string) {
    if (!workspace || !workspace.selfId || !workspace.currentDocUrl) {
      return
    }

    log('offerDocumentToIdentity')

    const { currentDocUrl } = workspace
    repo.change(workspace.selfId, (s: ContactDoc) => {
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

  function renderBody() {
    if (!workspace) {
      return null
    }

    switch (tab) {
      case 'profile':
        return renderProfile(workspace)
      case 'contacts':
        return renderContacts(workspace, offerDocumentToIdentity)
    }

    return null
  }

  return (
    <Popover>
      <div className="ListMenu">
        <div className="Tabs">
          <div
            role="button"
            className={tabClasses(tab, 'contacts')}
            onClick={() => setTab('contacts')}
          >
            <i className="fa fa-group" /> All Contacts
          </div>
          <div
            role="button"
            className={tabClasses(tab, 'profile')}
            onClick={() => setTab('profile')}
          >
            <i className="fa fa-pencil" /> Profile
          </div>
        </div>
        {renderBody()}
      </div>
    </Popover>
  )
}

function tabClasses(current: TabName, name: TabName) {
  return classnames('Tabs__tab', {
    'Tabs__tab--active': current === name,
  })
}

function renderProfile({ selfId }: WorkspaceDoc) {
  return <Content url={createDocumentLink('contact', selfId)} context="workspace" />
}

function renderContacts(
  { contactIds = [] }: WorkspaceDoc,
  offer: (contactId: HypermergeUrl) => void
) {
  const uniqueContactIds = contactIds.filter((id, i, a) => a.indexOf(id) === i)
  const noneFound = (
    <div className="ListMenu__item">
      <div className="ContactListMenuItem">
        <span className="ListMenu__thumbnail">
          <Badge icon="question-circle" backgroundColor="var(--colorPaleGrey)" />
        </span>
        <Label>
          <p className="Type--primary">None found</p>
          <p className="Type--secondary">Copy a link to your board and start making friends</p>
        </Label>
      </div>
    </div>
  )

  const share = {
    name: 'share',
    callback: (url: string) => () => offer(url),
    faIcon: 'fa-share-alt',
    label: 'Share',
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

  const contacts = uniqueContactIds.map((id) => (
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
