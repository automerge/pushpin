import Fs from 'fs'
import Path from 'path'
import { USER_PATH } from './model'
import Loop from './loop'

/* I'm propagating this pattern to eventually retire the other two cases... */
function saveWorkspaceId(state, { workspaceId }) {
  const workspaceIdFile = { workspaceId }

  Fs.writeFileSync(workspaceIdPath(), JSON.stringify(workspaceIdFile))

  return state
}

function workspaceIdPath() {
  return Path.join(USER_PATH, 'workspace-id.json')
}

export function getWorkspaceIdFile() {
  if (Fs.existsSync(workspaceIdPath())) {
    return JSON.parse(Fs.readFileSync(workspaceIdPath()))
  }
  return {}
}

export function newWorkspace(state) {
  const workspace = state.hm.create()
  const workspaceId = state.hm.getId(workspace)

  Loop.dispatch(saveWorkspaceId, { workspaceId })

  const nextWorkspace = state.hm.change(workspace, (w) => {
    w.selfDocId = ''
    w.documents = []
    w.addressBook = []
  })

  return { ...state, workspace: nextWorkspace }
}
