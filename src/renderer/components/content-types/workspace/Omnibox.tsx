/* eslint-disable react/sort-comp */
// this component has a bunch of weird pseudo-members that make eslint sad

import React, { useRef, useState, useCallback } from 'react'
import Debug from 'debug'

import { HypermergeUrl } from '../../../ShareLink'
import { WorkspaceUrlsApi } from '../../../WorkspaceHooks'
import WorkspaceInOmnibox from './WorkspaceInOmnibox'
import './Omnibox.css'

const log = Debug('pushpin:omnibox')

export interface Props {
  active: boolean
  hypermergeUrl: HypermergeUrl
  omniboxFinished: Function
  workspaceUrlsContext: WorkspaceUrlsApi | null
}

export default function Omnibox(props: Props) {
  const omniboxInput = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')

  const onInputChange = useCallback((e) => {
    setSearch(e.target.value)
  }, [])

  log('render')

  if (!props.workspaceUrlsContext) {
    return null
  }

  const { workspaceUrls } = props.workspaceUrlsContext

  return (
    <div className="Omnibox">
      <div className="Omnibox--header">
        <input
          className="Omnibox--input"
          type="text"
          ref={omniboxInput}
          onChange={onInputChange}
          value={search}
          placeholder="Search..."
        />
      </div>
      {workspaceUrls.map((url) => (
        <WorkspaceInOmnibox
          omniboxFinished={props.omniboxFinished}
          hypermergeUrl={props.hypermergeUrl}
          search={search}
          active={props.active}
        />
      ))}
    </div>
  )
}
