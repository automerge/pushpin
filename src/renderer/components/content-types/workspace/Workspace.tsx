import React, { useEffect, useContext, useRef } from 'react'
import Debug from 'debug'
import uuid from 'uuid'
import { Handle, Crypto } from 'hypermerge'

import { parseDocumentLink, PushpinUrl, HypermergeUrl, isPushpinUrl } from '../../../ShareLink'
import Content, { ContentProps, ContentHandle } from '../../Content'
import * as ContentTypes from '../../../ContentTypes'
import SelfContext from '../../SelfContext'
import TitleBar from './TitleBar'
import { ContactDoc } from '../contact'
import * as WebStreamLogic from '../../../../WebStreamLogic'

import './Workspace.css'
import { useDocument, useCrypto } from '../../../Hooks'
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
import * as DataUrl from '../../../../DataUrl'

const log = Debug('pushpin:workspace')

export interface Doc {
  selfId: HypermergeUrl
  contactIds: HypermergeUrl[]
  currentDocUrl: PushpinUrl
  viewedDocUrls: PushpinUrl[]
  archivedDocUrls: PushpinUrl[]
  secretKey?: Crypto.SignedMessage<Crypto.EncodedSecretEncryptionKey>
}

interface WorkspaceContentProps extends ContentProps {
  setWorkspaceUrl: (newWorkspaceUrl: PushpinUrl) => void
  createWorkspace: () => void
}

interface ClipperPayload {
  src: string
  dataUrl: string
  capturedAt: string
}

export default function Workspace(props: WorkspaceContentProps) {
  const crypto = useCrypto()
  const [workspace, changeWorkspace] = useDocument<Doc>(props.hypermergeUrl)
  const currentDeviceUrl = useContext(CurrentDeviceContext)

  const selfId = workspace && workspace.selfId
  const currentDocUrl =
    workspace && workspace.currentDocUrl && parseDocumentLink(workspace.currentDocUrl).hypermergeUrl

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

  // Add devices if not already on doc.
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

  // Add encryption keys if not already on doc.
  useEffect(() => {
    if (!workspace || !selfId || workspace.secretKey) return

    try {
      migrateEncryptionKeys()
    } catch {
      console.log(
        'Unable to set encryption keys on workspace. Must be on the device which created the workspace.'
      )
    }

    async function migrateEncryptionKeys() {
      if (!workspace || !selfId || workspace.secretKey) return
      const encryptionKeyPair = await crypto.encryptionKeyPair()
      const signedPublicKey = await crypto.sign(selfId, encryptionKeyPair.publicKey)
      const signedSecretKey = await crypto.sign(props.hypermergeUrl, encryptionKeyPair.secretKey)
      changeSelf((doc: ContactDoc) => {
        doc.encryptionKey = signedPublicKey
      })
      changeWorkspace((doc: Doc) => {
        doc.secretKey = signedSecretKey
      })
    }
  }, [workspace, selfId, workspace && workspace.secretKey])

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

    // Reset scroll position
    window.scrollTo(0, 0)

    changeWorkspace((ws: Doc) => {
      ws.currentDocUrl = docUrl

      ws.viewedDocUrls = ws.viewedDocUrls.filter((url) => url !== docUrl)
      ws.viewedDocUrls.unshift(docUrl)

      if (ws.archivedDocUrls) {
        ws.archivedDocUrls = ws.archivedDocUrls.filter((url) => url !== docUrl)
      }
    })
  }

  function importClip(payload: ClipperPayload) {
    const creationCallback = (importedUrl) => {
      changeWorkspace((d) => {
        d.viewedDocUrls.unshift(importedUrl)
      })
    }

    const { dataUrl, src, capturedAt } = payload

    const dataUrlInfo = DataUrl.parse(dataUrl)
    if (!dataUrlInfo) return
    const { mimeType, data, isBase64 } = dataUrlInfo
    const contentData = {
      mimeType,
      data: isBase64 ? WebStreamLogic.fromBase64(data) : WebStreamLogic.fromString(data),
      src,
      capturedAt,
    }

    if (mimeType.includes('text/plain')) {
      importPlainText(data, creationCallback)
    } else {
      ContentTypes.createFrom(contentData, creationCallback)
    }
  }

  const contentRef = useRef<ContentHandle>(null)

  function onContent(url: PushpinUrl) {
    if (contentRef.current) {
      return contentRef.current.onContent(url)
    }
    return false
  }

  log('render')
  if (!workspace) {
    return null
  }

  function renderContent(currentDocUrl?: PushpinUrl) {
    if (!currentDocUrl) {
      return null
    }

    const { type } = parseDocumentLink(currentDocUrl)
    return (
      <div className={`Workspace__container Workspace__container--${type}`}>
        <Content ref={contentRef} context="workspace" url={currentDocUrl} />
      </div>
    )
  }

  const content = renderContent(workspace.currentDocUrl)

  return (
    <SelfContext.Provider value={workspace.selfId}>
      <div className="Workspace">
        <TitleBar hypermergeUrl={props.hypermergeUrl} openDoc={openDoc} onContent={onContent} />
        {content}
      </div>
    </SelfContext.Provider>
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

function create(_attrs: any, handle: Handle<Doc>) {
  ContentTypes.create('contact', {}, (selfContentUrl) => {
    const selfHypermergeUrl = parseDocumentLink(selfContentUrl).hypermergeUrl
    // this is, uh, a nasty hack.
    // we should refactor not to require the hypermergeUrl on the contact
    // but i don't want to pull that in scope right now

    ContentTypes.create(
      'board',
      { title: 'Welcome to PushPin!', selfId: selfHypermergeUrl },
      (boardUrl) => {
        ContentTypes.create('text', { text: WELCOME_TEXT }, (textDocUrl) => {
          const id = uuid() as CardId
          repo.change(parseDocumentLink(boardUrl).hypermergeUrl, (doc: BoardDoc) => {
            doc.cards[id] = {
              url: textDocUrl,
              x: 20,
              y: 20,
              width: 320,
              height: 540,
            }
          })

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
