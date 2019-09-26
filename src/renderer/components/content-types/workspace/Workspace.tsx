import React, { useEffect } from 'react'
import Debug from 'debug'
import uuid from 'uuid'

import {
  parseDocumentLink,
  PushpinUrl,
  HypermergeUrl,
  isPushpinUrl,
  createDocumentLink,
} from '../../../ShareLink'
import Content, { ContentProps } from '../../Content'
import ContentTypes from '../../../ContentTypes'
import SelfContext from '../../SelfContext'
import TitleBar from './TitleBar'
import { ContactDoc } from '../contact'

import './Workspace.css'
import { useDocument } from '../../../Hooks'
import { useAllHeartbeats, useHeartbeat } from '../../../PresenceHooks'
import { BoardDoc, CardId } from '../board'
import { useSystem } from '../../../System'
import Badge from '../../Badge'

const log = Debug('pushpin:workspace')

export interface Doc {
  selfId: HypermergeUrl
  contactIds: HypermergeUrl[]
  currentDocUrl: PushpinUrl
  viewedDocUrls: PushpinUrl[]
  archivedDocUrls: PushpinUrl[]
}

interface WorkspaceContentProps extends ContentProps {
  setWorkspaceUrl: (newWorkspaceUrl: PushpinUrl) => void
}

export default function Workspace(props: WorkspaceContentProps) {
  const [workspace, changeWorkspace] = useDocument<Doc>(props.hypermergeUrl)

  const selfId = workspace && workspace.selfId
  const currentDocUrl = workspace && parseDocumentLink(workspace.currentDocUrl).hypermergeUrl

  useAllHeartbeats(selfId)
  useHeartbeat(selfId)
  useHeartbeat(currentDocUrl)

  const sendToSystem = useSystem(
    (msg) => {
      switch (msg.type) {
        case 'IncomingUrl':
          openDoc(msg.url)
          break

        case 'NewDocument':
          if (!selfId) break
          ContentTypes.create('board', { selfId }, (boardUrl: PushpinUrl) => {
            openDoc(boardUrl)
          })
          break
      }
    },
    [selfId]
  )

  useEffect(() => {
    // For background debugging:
    if (currentDocUrl) sendToSystem({ type: 'Navigated', url: currentDocUrl })
  }, [currentDocUrl])

  function openDoc(docUrl: string) {
    if (!isPushpinUrl(docUrl)) {
      return
    }

    try {
      parseDocumentLink(docUrl)
    } catch (e) {
      // if we can't parse the document, don't navigate
      return
    }

    const { type } = parseDocumentLink(docUrl)
    if (type === 'workspace') {
      // we're going to have to deal with this specially...
      props.setWorkspaceUrl(docUrl)
      return
    }

    if (!workspace) {
      log('Trying to navigate to a document before the workspace doc is loaded!')
      return
    }

    changeWorkspace((ws: Doc) => {
      ws.currentDocUrl = docUrl

      ws.viewedDocUrls = ws.viewedDocUrls.filter((url) => url !== docUrl)
      ws.viewedDocUrls.unshift(docUrl)

      if (ws.archivedDocUrls) {
        ws.archivedDocUrls = ws.archivedDocUrls.filter((url) => url !== docUrl)
      }
    })
  }

  log('render')
  if (!workspace) {
    return null
  }

  const content = renderContent(workspace.currentDocUrl)
  return (
    <SelfContext.Provider value={workspace.selfId}>
      <div className="Workspace">
        <TitleBar hypermergeUrl={props.hypermergeUrl} openDoc={openDoc} />
        {content}
      </div>
    </SelfContext.Provider>
  )
}

function renderContent(currentDocUrl?: PushpinUrl) {
  if (!currentDocUrl) {
    return null
  }

  const { type } = parseDocumentLink(currentDocUrl)
  return (
    <div className={`Workspace__container Workspace__container--${type}`}>
      <Content context="workspace" url={currentDocUrl} />
    </div>
  )
}

const WELCOME_TEXT = `Welcome to PushPin!

We've created your first text card for you.
You can edit it, or make more by double-clicking the background.

You can drag or paste images, text, and URLs onto the board. They'll be stored for offline usage.
If you right-click, you can choose the kind of card to make.
You can make new boards from the right-click menu or with Ctrl-N.

To edit the title of a board, click the pencil.
To share a board with another person, click the clipboard, then have them paste that value into the omnibox.

Quick travel around by clicking the Omnibox. Typing part of a name will show you people and boards that match that. The omnibox can also be opened with '/'.

To create links to boards or contacts, drag them from the title bar or the omnibox.`

function create(attrs, handle, callback) {
  ContentTypes.create('contact', {}, (selfContentUrl) => {
    const selfHypermergeUrl = parseDocumentLink(selfContentUrl).hypermergeUrl
    // this is, uh, a nasty hack.
    // we should refactor not to require the hypermergeUrl on the contact
    // but i don't want to pull that in scope right now
    window.repo.change(selfHypermergeUrl, (doc: ContactDoc) => {
      doc.hypermergeUrl = selfHypermergeUrl
    })

    ContentTypes.create(
      'board',
      { title: 'Welcome to PushPin!', selfId: selfHypermergeUrl },
      (boardUrl) => {
        ContentTypes.create('text', { text: WELCOME_TEXT }, (textDocUrl) => {
          const id = uuid() as CardId
          window.repo.change(parseDocumentLink(boardUrl).hypermergeUrl, (doc: BoardDoc) => {
            doc.cards[id] = {
              url: textDocUrl,
              x: 20,
              y: 20,
              width: 320,
              height: 540,
            }
          })
          // Then make changes to workspace doc.
          handle.change((workspace) => {
            workspace.selfId = selfHypermergeUrl
            workspace.contactIds = []
            workspace.currentDocUrl = boardUrl
            workspace.viewedDocUrls = [boardUrl]
          })
        })
      }
    )
  })
  callback()
}

function WorkspaceInTitleBar(props: WorkspaceContentProps) {
  const [workspace] = useDocument<Doc>(props.hypermergeUrl)

  const selfId = workspace && workspace.selfId

  if (!selfId) {
    return null
  }
  return (
    <div className="Workspace--TitleBar">
      <Content context="title-bar" url={createDocumentLink('contact', selfId)} />
      <div className="Workspace--Badge">
        <i
          className="Badge Badge--square fa fa-briefcase"
          style={{ background: 'var(--colorInputGrey)', fontSize: '12px' }}
        />
      </div>
    </div>
  )
}

ContentTypes.register({
  type: 'workspace',
  name: 'Workspace',
  icon: 'briefcase',
  contexts: { root: Workspace, 'title-bar': WorkspaceInTitleBar },
  resizable: false,
  unlisted: true,
  create,
})
