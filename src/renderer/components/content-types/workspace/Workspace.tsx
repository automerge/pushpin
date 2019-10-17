import React, { useEffect, useContext } from 'react'
import Debug from 'debug'
import uuid from 'uuid'

import { parseDocumentLink, PushpinUrl, HypermergeUrl, isPushpinUrl } from '../../../ShareLink'
import Content, { ContentProps } from '../../Content'
import ContentTypes from '../../../ContentTypes'
import SelfContext from '../../SelfContext'
import TitleBar from './TitleBar'
import { ContactDoc } from '../contact'

import './Workspace.css'
import { useDocument } from '../../../Hooks'
import {
  useAllHeartbeats,
  useHeartbeat,
  useContactOnlineStatus,
  useDeviceOnlineStatus,
} from '../../../PresenceHooks'
import { BoardDoc, CardId } from '../board'
import { useSystem } from '../../../System'
import { CurrentDeviceContext } from './Device'

import WorkspaceInList from './WorkspaceInList'
import { importPlainText } from '../../../ImportData'

const log = Debug('pushpin:workspace')

export interface Doc {
  selfId: HypermergeUrl
  contactIds: HypermergeUrl[]
  clips: PushpinUrl[] // this is a poor design, but fine(ish) for a POC
  currentDocUrl: PushpinUrl
  viewedDocUrls: PushpinUrl[]
  archivedDocUrls: PushpinUrl[]
}

interface WorkspaceContentProps extends ContentProps {
  setWorkspaceUrl: (newWorkspaceUrl: PushpinUrl) => void
  createWorkspace: () => void
}

export default function Workspace(props: WorkspaceContentProps) {
  const [workspace, changeWorkspace] = useDocument<Doc>(props.hypermergeUrl)
  const currentDeviceUrl = useContext(CurrentDeviceContext)

  const selfId = workspace && workspace.selfId
  const currentDocUrl = workspace && parseDocumentLink(workspace.currentDocUrl).hypermergeUrl

  const [self, changeSelf] = useDocument<ContactDoc>(selfId)
  const currentDeviceId = currentDeviceUrl
    ? parseDocumentLink(currentDeviceUrl).hypermergeUrl
    : null

  useAllHeartbeats(selfId)
  useHeartbeat(selfId)
  useHeartbeat(currentDeviceId)
  useHeartbeat(currentDocUrl)

  useDeviceOnlineStatus(currentDeviceId)
  useContactOnlineStatus(selfId)

  const sendToSystem = useSystem(
    (msg) => {
      switch (msg.type) {
        case 'IncomingUrl':
          openDoc(msg.url)
          break
        case 'IncomingClip':
          importClip(msg.payload)
          break
        case 'NewDocument':
          if (!selfId) break
          ContentTypes.create('board', { selfId }, (boardUrl: PushpinUrl) => {
            openDoc(boardUrl)
          })
          break
        case 'NewWorkspace':
          props.createWorkspace()
          break
      }
    },
    [selfId]
  )

  useEffect(() => {
    // For background debugging:
    if (currentDocUrl) sendToSystem({ type: 'Navigated', url: currentDocUrl })
  }, [currentDocUrl, sendToSystem])

  useEffect(() => {
    if (!currentDeviceUrl || !self) {
      return
    }

    const { hypermergeUrl } = parseDocumentLink(currentDeviceUrl)
    if (!self.devices || !self.devices.includes(hypermergeUrl)) {
      changeSelf((doc: ContactDoc) => {
        if (!doc.devices) {
          doc.devices = []
        }
        doc.devices.push(hypermergeUrl)
      })
    }
  }, [changeSelf, currentDeviceUrl, self])

  function openDoc(docUrl: string) {
    if (!isPushpinUrl(docUrl)) {
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

  function importClip(payload: any) {
    console.log('importing', payload)
    const creationCallback = (importedUrl) => {
      changeWorkspace((d) => {
        if (!d.clips) {
          d.clips = []
        }
        d.clips.unshift(importedUrl)
      })
    }

    switch (payload.type) {
      case 'Text':
        importPlainText(payload.content, creationCallback)
        break
      case 'Html':
        ContentTypes.create('url', payload, creationCallback)
        break
      case 'Image':
        ContentTypes.create('file', payload, creationCallback)
        break
      default:
        throw new Error(`no idea how to deal with ${payload.type}`)
    }
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

ContentTypes.register({
  type: 'workspace',
  name: 'Workspace',
  icon: 'briefcase',
  contexts: {
    root: Workspace,
    list: WorkspaceInList,
    board: WorkspaceInList,
  },
  resizable: false,
  unlisted: true,
  create,
})
