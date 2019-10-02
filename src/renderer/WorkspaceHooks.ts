import { useEffect, useState, createContext, useCallback } from 'react'
import Fs from 'fs'
import { WORKSPACE_URL_PATH } from './constants'
import { PushpinUrl } from './ShareLink'
import ContentTypes from './ContentTypes'

function loadWorkspaceUrls(): PushpinUrl[] {
  if (Fs.existsSync(WORKSPACE_URL_PATH)) {
    const json = JSON.parse(Fs.readFileSync(WORKSPACE_URL_PATH, { encoding: 'utf-8' }))
    if (json.workspaceUrl) {
      return [json.workspaceUrl]
    }
    if (json.workspaceUrls) {
      return json.workspaceUrls
    }
  }
  return []
}

function saveWorkspaceUrls(workspaceUrls: PushpinUrl[]): void {
  const workspaceUrlData = { workspaceUrls }
  Fs.writeFileSync(WORKSPACE_URL_PATH, JSON.stringify(workspaceUrlData))
}

export interface UseWorkspaceUrlsHook {
  workspaceUrls: PushpinUrl[]
  addWorkspaceUrl: (url: PushpinUrl) => void
  removeWorkspaceUrl: (url: PushpinUrl) => void
  createWorkspace: () => void
}

export function useWorkspaceUrls(): UseWorkspaceUrlsHook {
  const [workspaceUrls, setWorkspaceUrls] = useState<PushpinUrl[]>([])

  useEffect(() => {
    const existingWorkspaceUrls = loadWorkspaceUrls()
    if (existingWorkspaceUrls.length > 0) {
      setWorkspaceUrls(existingWorkspaceUrls)
    } else {
      createWorkspace()
    }
  }, [])

  useEffect(() => {
    if (workspaceUrls.length > 0) {
      saveWorkspaceUrls(workspaceUrls)
    }
  }, [workspaceUrls])

  const addWorkspaceUrl = useCallback(
    (workspaceUrl) => {
      const newWorkspaceUrls = [workspaceUrl, ...workspaceUrls.filter((u) => u !== workspaceUrl)]
      setWorkspaceUrls(newWorkspaceUrls)
    },
    [workspaceUrls]
  )

  const removeWorkspaceUrl = useCallback(
    (workspaceUrl) => {
      setWorkspaceUrls(workspaceUrls.filter((w) => w === workspaceUrl))
    },
    [workspaceUrls]
  )

  const createWorkspace = useCallback(() => {
    ContentTypes.create('workspace', {}, (newWorkspaceUrl: PushpinUrl) => {
      addWorkspaceUrl(newWorkspaceUrl)
    })
  }, [workspaceUrls])

  return { workspaceUrls, addWorkspaceUrl, removeWorkspaceUrl, createWorkspace }
}

export const WorkspaceUrlsContext = createContext<UseWorkspaceUrlsHook | null>(null)
