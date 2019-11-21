import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { clipboard } from 'electron'

import Omnibox from './omnibox/Omnibox'
import Content from '../../Content'
import Authors from './Authors'
import {
  HypermergeUrl,
  PushpinUrl,
  createDocumentLink,
  parseDocumentLink,
} from '../../../ShareLink'

import './TitleBar.css'
import { useDocument, useEvent } from '../../../Hooks'
import { WorkspaceUrlsContext } from '../../../WorkspaceHooks'
import { Doc as WorkspaceDoc } from './Workspace'
import Badge from '../../Badge'

export interface Props {
  hypermergeUrl: HypermergeUrl
  openDoc: Function
  onContent: (url: PushpinUrl) => boolean
}

export default function TitleBar(props: Props) {
  const [sessionHistory, setHistory] = useState<PushpinUrl[]>([])
  const [historyIndex, setIndex] = useState(0)
  const [activeOmnibox, setActive] = useState(false)
  const [doc] = useDocument<WorkspaceDoc>(props.hypermergeUrl)

  useEvent(document, 'keydown', (e) => {
    if (e.key === '/' && document.activeElement === document.body) {
      if (!activeOmnibox) {
        showOmnibox()
        e.preventDefault()
      }
    }

    if (e.key === 'Escape' && activeOmnibox) {
      hideOmnibox()
      e.preventDefault()
    }
  })

  const backDisabled = historyIndex === sessionHistory.length - 1
  const forwardDisabled = historyIndex === 0

  useEffect(() => {
    if (!doc || !doc.currentDocUrl) {
      return
    }

    // Init sessionHistory
    if (sessionHistory.length === 0) {
      setHistory([doc.currentDocUrl])
      // If we're opening a new document (as opposed to going back or forward),
      // add it to our sessionHistory and remove all docs 'forward' of the current index
    } else if (doc.currentDocUrl !== sessionHistory[historyIndex]) {
      setHistory([doc.currentDocUrl, ...sessionHistory.slice(historyIndex)])
      setIndex(0)
    }
  }, [doc, historyIndex, sessionHistory])

  function goBack() {
    if (backDisabled) {
      throw new Error('Can not go back further than session history')
    }
    const newIndex = historyIndex + 1
    props.openDoc(sessionHistory[newIndex])
    setIndex(newIndex)
  }

  function goForward() {
    if (forwardDisabled) {
      throw new Error('Can not go forward past session history')
    }
    const newIndex = historyIndex - 1
    props.openDoc(sessionHistory[newIndex])
    setIndex(newIndex)
  }

  function copyLink(e: React.MouseEvent) {
    if (doc && doc.currentDocUrl) {
      clipboard.writeText(doc.currentDocUrl)
    }
  }

  function showOmnibox() {
    setActive(true)
  }

  function hideOmnibox() {
    setActive(false)
  }

  if (!doc || !doc.currentDocUrl) {
    return null
  }

  const { hypermergeUrl: currentDocHypermergeUrl } = parseDocumentLink(doc.currentDocUrl)

  return (
    <div className="TitleBar">
      <div className="TitleBar-section left">
        <button
          disabled={backDisabled}
          type="button"
          onClick={goBack}
          className="TitleBar-menuItem"
        >
          <i className="fa fa-angle-left" />
        </button>
        <button type="button" onClick={showOmnibox} className="TitleBar-menuItem">
          <Badge icon="map" backgroundColor="#00000000" />
        </button>

        <button
          disabled={forwardDisabled}
          type="button"
          onClick={goForward}
          className="TitleBar-menuItem"
        >
          <i className="fa fa-angle-right" />
        </button>
      </div>

      <div className="TitleBar-section">
        <Content url={doc.currentDocUrl} context="list" editable />
      </div>
      <div className="TitleBar-section right">
        <Authors currentDocUrl={currentDocHypermergeUrl} workspaceUrl={props.hypermergeUrl} />
        <div className="TitleBar-self">
          <Content url={createDocumentLink('contact', doc.selfId)} context="title-bar" isPresent />
        </div>

        <button
          className="BoardTitle__clipboard BoardTitle__labeledIcon TitleBar-menuItem"
          type="button"
          onClick={copyLink}
        >
          <i className="fa fa-clipboard" />
        </button>
      </div>

      <div className="TitleBar-controls" id="TitleBar_Controls" />

      <WorkspaceUrlsContext.Consumer>
        {(workspaceUrlsContext) => (
          <Omnibox
            active={activeOmnibox}
            hypermergeUrl={props.hypermergeUrl}
            omniboxFinished={hideOmnibox}
            onContent={props.onContent}
            workspaceUrlsContext={workspaceUrlsContext}
          />
        )}
      </WorkspaceUrlsContext.Consumer>
    </div>
  )
}

export function TitleBarControls(props: { children: React.ReactNode }) {
  const container = document.getElementById('TitleBar_Controls')
  return container
    ? createPortal(<div className="TitleBar-controls-inner">{props.children}</div>, container)
    : null
}
