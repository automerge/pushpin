/* eslint-disable react/sort-comp */
// this component has a bunch of weird pseudo-members that make eslint sad

import React, { useRef, useState, useCallback, useEffect } from 'react'
import Debug from 'debug'

import { HypermergeUrl, parseDocumentLink, PushpinUrl } from '../../../../ShareLink'
import { WorkspaceUrlsApi } from '../../../../WorkspaceHooks'
import OmniboxWorkspace from './OmniboxWorkspace'
import './Omnibox.css'

const log = Debug('pushpin:omnibox')

export interface Props {
  active: boolean
  hypermergeUrl: HypermergeUrl
  omniboxFinished: Function
  workspaceUrlsContext: WorkspaceUrlsApi | null
  onContent: (url: PushpinUrl) => boolean
}

export default function Omnibox(props: Props) {
  const { active, workspaceUrlsContext } = props
  const omniboxInput = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')

  const onInputChange = useCallback((e) => {
    setSearch(e.target.value)
  }, [])

  useEffect(() => {
    if (active && omniboxInput.current) {
      omniboxInput.current.focus()
    }
  }, [active])

  log('render')

  if (!workspaceUrlsContext) {
    return null
  }

  const { workspaceUrls } = workspaceUrlsContext

  return (
    <div className="Omnibox">
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
              onContent={props.onContent}
              omniboxFinished={props.omniboxFinished}
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
