import React, { useCallback } from 'react'
import { DocUrl } from 'hypermerge'
import { clipboard } from 'electron'
import { createDocumentLink, PushpinUrl } from '../../../../ShareLink'
import { useDocument } from '../../../../Hooks'
import Content from '../../../Content'
import { Doc as WorkspaceDoc } from '../Workspace'
import { ContactDoc } from '../../contact'
import OmniboxWorkspaceListMenu from './OmniboxWorkspaceListMenu'
import ListMenuHeader from '../../../ui/ListMenuHeader'
import Badge from '../../../ui/Badge'

import './OmniboxWorkspace.css'

export interface Props {
  viewContents: boolean
  active: boolean
  search: string
  hypermergeUrl: DocUrl
  omniboxFinished: Function
  onContent: (url: PushpinUrl) => boolean
}

export default function OmniboxWorkspace(props: Props) {
  const { active, search, hypermergeUrl, omniboxFinished, viewContents, onContent } = props
  const [workspaceDoc] = useDocument<WorkspaceDoc>(hypermergeUrl)
  const [selfDoc] = useDocument<ContactDoc>(workspaceDoc && workspaceDoc.selfId)

  const onClickWorkspace = useCallback(
    (e) => {
      omniboxFinished()
    },
    [omniboxFinished]
  )

  const onClickWorkspaceCopy = useCallback(
    (e) => {
      clipboard.writeText(createDocumentLink('workspace', hypermergeUrl))
    },
    [hypermergeUrl]
  )

  if (!selfDoc || !workspaceDoc) {
    return null
  }

  const { selfId } = workspaceDoc
  const { name = [] } = selfDoc

  return (
    <div className="OmniboxWorkspace" onClick={onClickWorkspace}>
      <ListMenuHeader>
        <a href={createDocumentLink('workspace', hypermergeUrl)} className="OmniboxWorkspace-name">
          {name}&apos;s Documents
        </a>
        <div className="OmniboxWorkspace-badge" key="contact">
          <Content context="title-bar" url={createDocumentLink('contact', selfId)} />
        </div>

        <div className="OmniboxWorkspace-badge" key="copy" onClick={onClickWorkspaceCopy}>
          <Badge shape="circle" icon="clipboard" size="large" />
        </div>
      </ListMenuHeader>
      {!viewContents ? null : (
        <OmniboxWorkspaceListMenu
          active={active}
          search={search}
          onContent={onContent}
          hypermergeUrl={hypermergeUrl}
          omniboxFinished={omniboxFinished}
        />
      )}
    </div>
  )
}
