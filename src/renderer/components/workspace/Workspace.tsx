import React, { useEffect } from 'react'
import Debug from 'debug'
import { ipcRenderer } from 'electron'
import uuid from 'uuid'

import { createDocumentLink, parseDocumentLink, PushpinUrl, HypermergeUrl } from '../../ShareLink'
import Content, { ContentProps } from '../Content'
import ContentTypes from '../../ContentTypes'
import SelfContext from '../SelfContext'
import TitleBar from './TitleBar'
import { ContactDoc } from '../contact'

import './Workspace.css'
import { useDocument, useInterval, useMessaging } from '../../Hooks'
import { BoardDoc } from '../board'

const log = Debug('pushpin:workspace')

export interface Doc {
  selfId: HypermergeUrl
  contactIds: PushpinUrl[]
  currentDocUrl: PushpinUrl
  viewedDocUrls: PushpinUrl[]
  archivedDocUrls: PushpinUrl[]
}

export default function Workspace(props: ContentProps) {
  const [workspace, changeWorkspace] = useDocument<Doc>(props.hypermergeUrl)

  const selfId = workspace && workspace.selfId
  const currentDocUrl = workspace && parseDocumentLink(workspace.currentDocUrl).hypermergeUrl

  useHeartbeat(selfId, currentDocUrl)

  function openDoc(docUrl: PushpinUrl) {
    try {
      parseDocumentLink(docUrl)
    } catch (e) {
      // if we can't parse the document, don't navigate
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

  useEffect(() => {
    if (!selfId) {
      return () => {}
    }

    function onLoad(event: any, url: string) {
      openDoc(url)
    }

    function onNew() {
      const hypermergeUrl = Content.initializeContentDoc('board', { selfId })
      openDoc(createDocumentLink('board', hypermergeUrl))
    }

    ipcRenderer.on('loadDocumentUrl', onLoad)
    ipcRenderer.on('newDocument', onNew)

    return () => {
      ipcRenderer.removeListener('loadDocumentUrl', onLoad)
      ipcRenderer.removeListener('newDocument', onNew)
    }
  }, [selfId])

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

function useHeartbeat(selfId: string | null, docUrl: string | null) {
  const sendSelf = useMessaging(selfId, () => {})
  const sendCurrent = useMessaging(docUrl, () => {})

  useInterval(
    1000,
    () => {
      // The workspace takes on two responsibilities around presence.
      // First, it posts on the self-contact ID that we're online.
      // This means any avatar anywhere will have a colored ring around it
      // if that user is online.
      sendSelf('heartbeat')

      // Second, it posts a presence heartbeat on the document currently
      // considered to be open, allowing any kind of card to render a list of
      // "present" folks.
      // NB: The current implementation doesn't have any caching of messages,
      //     so "present" avatars will have to wait for a second heartbeat to arrive
      //     before appearing present since the first one will have passed in causing
      //     them to render...
      sendCurrent({ contact: selfId, heartbeat: true })
    },
    [sendSelf, sendCurrent]
  )

  // Send departure when current doc changes
  useEffect(() => {
    return () => {
      sendCurrent({ contact: selfId, departing: true })
    }
  }, [sendCurrent])
}

function initializeDocument(workspace: Doc) {
  const selfId = Content.initializeContentDoc('contact')

  // this is, uh, a nasty hack.
  // we should refactor not to require the hypermergeUrl on the contact
  // but i don't want to pull that in scope right now
  window.repo.change(selfId, (doc: ContactDoc) => {
    doc.hypermergeUrl = selfId
  })

  const boardId = Content.initializeContentDoc('board', { title: 'Welcome to PushPin!', selfId })
  const docUrl = createDocumentLink('board', boardId)

  const text = `Welcome to PushPin!

We've created your first text card for you.
You can edit it, or make more by double-clicking the background.

You can drag or paste images, text, and URLs onto the board. They'll be stored for offline usage.
If you right-click, you can choose the kind of card to make.
You can make new boards from the right-click menu or with Ctrl-N.

To edit the title of a board, click the pencil.
To share a board with another person, click the clipboard, then have them paste that value into the omnibox.

Quick travel around by clicking the Omnibox. Typing part of a name will show you people and boards that match that. The omnibox can also be opened with '/'.

To create links to boards or contacts, drag them from the title bar or the omnibox.`

  const textDocId = Content.initializeContentDoc('text', { text })
  const textDocUrl = createDocumentLink('text', textDocId)

  const id = uuid()
  window.repo.change(boardId, (doc: BoardDoc) => {
    doc.cards[id] = {
      type: 'text',
      id,
      url: textDocUrl,
      x: 20,
      y: 20,
      width: 320,
      height: 540,
    }
  })

  // Then make changes to workspace doc.
  workspace.selfId = selfId
  workspace.contactIds = []
  workspace.currentDocUrl = docUrl
  workspace.viewedDocUrls = [docUrl]
}

ContentTypes.register({
  type: 'workspace',
  name: 'Workspace',
  icon: 'briefcase',
  contexts: { root: Workspace },
  resizable: false,
  unlisted: true,
  initializeDocument,
})
