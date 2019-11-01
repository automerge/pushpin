/* eslint-disable react/sort-comp */
// this component has a bunch of weird pseudo-members that make eslint sad

import React, { useRef, useState, useCallback, useEffect } from 'react'
import Debug from 'debug'

import { HypermergeUrl, parseDocumentLink, PushpinUrl } from '../../../../ShareLink'
import { WorkspaceUrlsApi } from '../../../../WorkspaceHooks'
import OmniboxWorkspace from './OmniboxWorkspace'
import './Omnibox.css'
import { useEvent } from '../../../../Hooks'

const log = Debug('pushpin:omnibox')

export interface Props {
  active: boolean
  hypermergeUrl: HypermergeUrl
  omniboxFinished: Function
  workspaceUrlsContext: WorkspaceUrlsApi | null
  onContent: (url: PushpinUrl) => boolean
}

export default function Omnibox(props: Props) {
  const { active, workspaceUrlsContext, omniboxFinished, onContent } = props
  const omniboxInput = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')

  const onInputChange = useCallback((e) => {
    setSearch(e.target.value)
  }, [])

  const omniboxRef = useRef<HTMLDivElement>(null)
  useEvent(window, 'click', (event) => {
    if (!omniboxRef.current) {
      return
    }
    if (event.target !== omniboxRef.current && !omniboxRef.current.contains(event.target)) {
      omniboxFinished()
    }
  })

  useEffect(() => {
    if (active && omniboxInput.current) {
      omniboxInput.current.focus()
      omniboxInput.current.select()
    }
  }, [active])

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
  }, [])

  log('render')

  if (!workspaceUrlsContext) {
    return null
  }

  const { workspaceUrls } = workspaceUrlsContext

  return (
    <div className="Omnibox" ref={omniboxRef} onPaste={stopPropagation}>
      <div className="Omnibox-header">
        <input
          className="Omnibox-input"
          type="text"
          ref={omniboxInput}
          onChange={onInputChange}
          value={search}
          placeholder="Search..."
        />
      </div>
      <div className="Omnibox-Workspaces">
        {workspaceUrls.map((url, i) => {
          const { hypermergeUrl } = parseDocumentLink(url)
          return (
            <OmniboxWorkspace
              key={url}
              viewContents={i === 0}
              onContent={onContent}
              omniboxFinished={omniboxFinished}
              hypermergeUrl={hypermergeUrl}
              search={search}
              active={active}
            />
          )
        })}
      </div>
    </div>
  )
}
