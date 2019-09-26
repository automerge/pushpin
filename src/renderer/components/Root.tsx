import React from 'react'

import { RepoFrontend } from 'hypermerge'
import Content from './Content'
import { RepoContext } from '../Hooks'
import { useCurrentDeviceUrl, CurrentDeviceContext } from './content-types/workspace/Device'

// We load these modules here so that the content registry will have them.
import './content-types/workspace/Workspace'

// default context components
import './content-types/defaults/DefaultInList'

// board in various contexts
import './content-types/board'
import './content-types/contact'
import './content-types/files'

// other single-context components
import './content-types/TextContent'
import './content-types/ThreadContent'
import './content-types/UrlContent'
import './content-types/files/ImageContent'
// disabled for now
import './content-types/files/AudioContent'
import './content-types/files/VideoContent'
import './content-types/files/PdfContent'
import System, { SystemContext } from '../System'
import { useWorkspaceUrl } from '../WorkspaceHooks'

interface Props {
  repo: RepoFrontend
  system: System
}

export default function Root({ repo, system }: Props) {
  const [workspaceUrl, setWorkspaceUrl] = useWorkspaceUrl()
  const currentDeviceUrl = useCurrentDeviceUrl()

  if (!workspaceUrl) {
    return null
  }

  return (
    <RepoContext.Provider value={repo}>
      <SystemContext.Provider value={system}>
        <CurrentDeviceContext.Provider value={currentDeviceUrl}>
          <Content context="root" url={workspaceUrl} setWorkspaceUrl={setWorkspaceUrl} />
        </CurrentDeviceContext.Provider>
      </SystemContext.Provider>
    </RepoContext.Provider>
  )
}
