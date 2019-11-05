import React from 'react'

import { RepoFrontend } from 'hypermerge'
import Content from './Content'
import { RepoContext } from '../Hooks'
import { useCurrentDeviceUrl, CurrentDeviceContext } from './content-types/workspace/Device'
import { useWorkspaceUrls, WorkspaceUrlsContext } from '../WorkspaceHooks'

// We load these modules here so that the content registry will have them.
import './content-types/workspace/Workspace'

// default context components
import './content-types/defaults/DefaultInList'

// board in various contexts
import './content-types/board'
import './content-types/contact'
import './content-types/files'
import './content-types/storage-peer'

// other single-context components
import './content-types/Inspector'
import './content-types/TextContent'
import './content-types/ThreadContent'
import './content-types/UrlContent'
import './content-types/files/ImageContent'
import './content-types/files/AudioContent'
import './content-types/files/VideoContent'
import './content-types/files/PdfContent'
import System, { SystemContext } from '../System'

interface Props {
  repo: RepoFrontend
  system: System
}

export default function Root({ repo, system }: Props) {
  const workspaceUrlsContextData = useWorkspaceUrls()

  const currentDeviceUrl = useCurrentDeviceUrl()

  const { workspaceUrls, addWorkspaceUrl, createWorkspace } = workspaceUrlsContextData
  if (!workspaceUrls[0]) {
    return <div>No workspace urls</div>
  }

  return (
    <RepoContext.Provider value={repo}>
      <SystemContext.Provider value={system}>
        <WorkspaceUrlsContext.Provider value={workspaceUrlsContextData}>
          <CurrentDeviceContext.Provider value={currentDeviceUrl}>
            <Content
              context="root"
              url={workspaceUrls[0]}
              setWorkspaceUrl={addWorkspaceUrl}
              createWorkspace={createWorkspace}
            />
          </CurrentDeviceContext.Provider>
        </WorkspaceUrlsContext.Provider>
      </SystemContext.Provider>
    </RepoContext.Provider>
  )
}
