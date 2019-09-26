import { useEffect, useState } from 'react'
import Fs from 'fs'
import { WORKSPACE_URL_PATH } from './constants'
import ContentTypes from './ContentTypes'
import { PushpinUrl } from './ShareLink'

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

export function useWorkspaceUrl(): [PushpinUrl | null, (newUrl: PushpinUrl) => void] {
  const [workspaceUrl, setWorkspaceUrl] = useState<PushpinUrl | null>(null)

  useEffect(() => {
    if (workspaceUrl !== null) {
      return
    }
    const existingWorkspaceUrl = loadWorkspaceUrl()
    if (existingWorkspaceUrl) {
      setWorkspaceUrl(existingWorkspaceUrl)
    } else {
      ContentTypes.create('workspace', {}, (newWorkspaceUrl: PushpinUrl) => {
        setWorkspaceUrl(newWorkspaceUrl)
      })
    }
  }, [workspaceUrl])

  useEffect(() => {
    if (workspaceUrl) {
      saveWorkspaceUrl(workspaceUrl)
    }
  }, [workspaceUrl])

  return [workspaceUrl, setWorkspaceUrl]
}
