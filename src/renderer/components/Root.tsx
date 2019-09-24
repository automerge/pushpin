import React, { useEffect, useState } from 'react'
import Fs from 'fs'

import { RepoFrontend } from 'hypermerge'
import Content from './Content'
import { RepoContext } from '../Hooks'
import { PushpinUrl } from '../ShareLink'
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
import { WORKSPACE_URL_PATH } from '../constants'
import ContentTypes from '../ContentTypes'

interface Props {
  repo: RepoFrontend
  system: System
}

function loadWorkspaceUrl(): PushpinUrl | null {
  if (Fs.existsSync(WORKSPACE_URL_PATH)) {
    const json = JSON.parse(Fs.readFileSync(WORKSPACE_URL_PATH, { encoding: 'utf-8' }))
    if (json.workspaceUrl) {
      return json.workspaceUrl
    }
  }
  return null
}

function saveWorkspaceUrl(workspaceUrl: PushpinUrl): void {
  const workspaceUrlData = { workspaceUrl }
  Fs.writeFileSync(WORKSPACE_URL_PATH, JSON.stringify(workspaceUrlData))
}

function useWorkspaceUrl(): [PushpinUrl | null, (newUrl: PushpinUrl) => void] {
  const [workspaceUrl, setWorkspaceUrl] = useState<PushpinUrl | null>(null)

  useEffect(() => {
    const existingWorkspaceUrl = loadWorkspaceUrl()
    if (existingWorkspaceUrl) {
      setWorkspaceUrl(existingWorkspaceUrl)
    } else {
      ContentTypes.create('workspace', {}, (newWorkspaceUrl: PushpinUrl) => {
        saveWorkspaceUrl(newWorkspaceUrl)
        setWorkspaceUrl(newWorkspaceUrl)
      })
    }
  }, [workspaceUrl])

  return [workspaceUrl, setWorkspaceUrl]
}

export default function Root({ repo, system }: Props) {
  const [workspaceUrl] = useWorkspaceUrl()
  const currentDeviceUrl = useCurrentDeviceUrl()

  if (!workspaceUrl) {
    return null
  }

  return (
    <RepoContext.Provider value={repo}>
      <SystemContext.Provider value={system}>
        <CurrentDeviceContext.Provider value={currentDeviceUrl}>
          <Content context="root" url={workspaceUrl} />
        </CurrentDeviceContext.Provider>
      </SystemContext.Provider>
    </RepoContext.Provider>
  )
}
