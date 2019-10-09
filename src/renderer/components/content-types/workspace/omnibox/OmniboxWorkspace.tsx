import React, { useCallback } from 'react'
import { DocUrl } from 'hypermerge'
import { clipboard } from 'electron'
import { createDocumentLink } from '../../../../ShareLink'
import { useDocument } from '../../../../Hooks'
import Content from '../../../Content'
import { Doc as WorkspaceDoc } from '../Workspace'
import { ContactDoc } from '../../contact'
import OmniboxWorkspaceListMenu from './OmniboxWorkspaceListMenu'
import ListMenuHeader from '../../../ListMenuHeader'
import Badge from '../../../Badge'

import './OmniboxWorkspace.css'

export interface Props {
  viewContents: boolean
  active: boolean
  search: string
  hypermergeUrl: DocUrl
  omniboxFinished: Function
}

export default function OmniboxWorkspace(props: Props) {
  const { active, search, hypermergeUrl, omniboxFinished, viewContents } = props
  const [workspaceDoc] = useDocument<WorkspaceDoc>(hypermergeUrl)
  const [selfDoc] = useDocument<ContactDoc>(workspaceDoc && workspaceDoc.selfId)

  const onClickWorkspace = useCallback((e) => {
    omniboxFinished()
  }, [])

  const onClickWorkspaceCopy = useCallback((e) => {
    clipboard.writeText(createDocumentLink('workspace', hypermergeUrl))
  }, [])

  if (!selfDoc || !workspaceDoc) {
    return null
  }

  const { selfId } = workspaceDoc
  const { color, name = [] } = selfDoc

  return (
    <div
      className="OmniboxWorkspace"
      onClick={onClickWorkspace}
      style={{ '--workspace-color': color } as any}
    >
      <div className="OmniboxWorkspace-overlay">
        <ListMenuHeader>
          <a
            href={createDocumentLink('workspace', hypermergeUrl)}
            className="OmniboxWorkspace-name"
          >
            {name}&apos;s Documents
          </a>
          <div className="OmniboxWorkspace-badge" key="contact">
            <a href={createDocumentLink('contact', selfId)}>
              <Content context="title-bar" url={createDocumentLink('contact', selfId)} />
            </a>
          </div>

          <div className="OmniboxWorkspace-badge" key="copy" onClick={onClickWorkspaceCopy}>
            <Badge shape="circle" icon="clipboard" size="large" />
          </div>
        </ListMenuHeader>
        {!viewContents ? null : (
          <OmniboxWorkspaceListMenu
            active={active}
            search={search}
            hypermergeUrl={hypermergeUrl}
            omniboxFinished={omniboxFinished}
          />
        )}
      </div>
    </div>
  )
}
