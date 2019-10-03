import React, { useCallback } from 'react'
import { DocUrl } from 'hypermerge'
import { clipboard } from 'electron'
import Content from '../../../Content'
import ListMenuInWorkspace from './ListMenuInWorkspace'
import { createDocumentLink } from '../../../../ShareLink'
import Badge from '../../../Badge'
import './WorkspaceInOmnibox.css'
import { useDocument } from '../../../../Hooks'
import { Doc as WorkspaceDoc } from '../Workspace'
import { ContactDoc } from '../../contact'
import ListMenuHeader from '../../../ListMenuHeader'

export interface Props {
  viewContents: boolean
  active: boolean
  search: string
  hypermergeUrl: DocUrl
  omniboxFinished: Function
}

export default function WorkspaceInOmnibox(props: Props) {
  const { active, search, hypermergeUrl, omniboxFinished, viewContents } = props
  const [workspaceDoc] = useDocument<WorkspaceDoc>(hypermergeUrl)
  const [selfDoc] = useDocument<ContactDoc>(workspaceDoc && workspaceDoc.selfId)

  const onClickWorkspaceCopy = useCallback((e) => {
    clipboard.writeText(createDocumentLink('workspace', hypermergeUrl))
  }, [])

  if (!selfDoc || !workspaceDoc) {
    return null
  }

  const { selfId } = workspaceDoc
  const { color, name } = selfDoc

  return (
    <div className="WorkspaceInOmnibox" style={{ '--workspace-color': color } as any}>
      <div className="WorkspaceInOmnibox-TemporaryFigLeaf">
        <ListMenuHeader>
          <a
            href={createDocumentLink('workspace', hypermergeUrl)}
            className="WorkspaceInOmnibox-Title"
          >
            {name}&apos;s Documents
          </a>
          <Content context="title-bar" url={createDocumentLink('contact', selfId)} />
          <div onClick={onClickWorkspaceCopy}>
            <i
              className="Badge Badge--circle fa fa-clipboard"
              style={{ fontSize: '14px', background: color }}
            />
          </div>
        </ListMenuHeader>
        {!viewContents ? null : (
          <ListMenuInWorkspace
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
