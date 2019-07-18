import React, { useRef, useState, useEffect } from 'react'
import { clipboard } from 'electron'

import Dropdown, { DropdownContent, DropdownTrigger } from '../react-simple-dropdown/dropdown'
import Omnibox from './Omnibox'
import Content from '../Content'
import Authors from './Authors'
import Share from './Share'
import { HypermergeUrl, PushpinUrl } from '../../ShareLink'

import './TitleBar.css'
import { useDocument, useEvent } from '../../Hooks'

export interface Props {
  hypermergeUrl: HypermergeUrl
  openDoc: Function
}

interface Doc {
  currentDocUrl?: PushpinUrl
}

export default function TitleBar(props: Props) {
  const [sessionHistory, setHistory] = useState<PushpinUrl[]>([])
  const [historyIndex, setIndex] = useState(0)
  const [activeOmnibox, setActive] = useState(false)
  const [doc] = useDocument<Doc>(props.hypermergeUrl)

  const dropdownRef = useRef<Dropdown>(null)

  useEvent(document, 'keydown', (e) => {
    if (e.key === '/' && document.activeElement === document.body) {
      if (!activeOmnibox) {
        activateOmnibox()
        e.preventDefault()
      }
    }

    if (e.key === 'Escape' && activeOmnibox) {
      deactivateOmnibox()
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
  }, [doc && doc.currentDocUrl])

  function activateOmnibox() {
    dropdownRef.current && dropdownRef.current.show()
  }

  function deactivateOmnibox() {
    dropdownRef.current && dropdownRef.current.hide()
  }

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

  function onShow() {
    setActive(true)
  }

  function onHide() {
    setActive(false)
  }

  if (!doc || !doc.currentDocUrl) {
    return null
  }

  return (
    <div className="TitleBar">
      <button disabled={backDisabled} type="button" onClick={goBack} className="TitleBar__menuItem">
        <i className="fa fa-angle-left" />
      </button>
      <Dropdown
        ref={dropdownRef}
        className="TitleBar__menuItem TitleBar__right"
        onShow={onShow}
        onHide={onHide}
      >
        <DropdownTrigger>
          <i className="fa fa-map" />
        </DropdownTrigger>
        <DropdownContent>
          <Omnibox
            active={activeOmnibox}
            hypermergeUrl={props.hypermergeUrl}
            omniboxFinished={deactivateOmnibox}
          />
        </DropdownContent>
      </Dropdown>

      <button
        disabled={forwardDisabled}
        type="button"
        onClick={goForward}
        className="TitleBar__menuItem"
      >
        <i className="fa fa-angle-right" />
      </button>

      <Content url={doc.currentDocUrl} context="list" editable />
      <Authors hypermergeUrl={props.hypermergeUrl} />

      <Dropdown
        className="TitleBar__menuItem
        TitleBar__right"
      >
        <DropdownTrigger>
          <i className="fa fa-group" />
        </DropdownTrigger>
        <DropdownContent>
          <Share hypermergeUrl={props.hypermergeUrl} />
        </DropdownContent>
      </Dropdown>

      <button
        className="BoardTitle__clipboard BoardTitle__labeledIcon TitleBar__menuItem"
        type="button"
        onClick={copyLink}
      >
        <i className="fa fa-clipboard" />
      </button>
    </div>
  )
}
