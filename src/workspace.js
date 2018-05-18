import Fs from 'fs'
import Path from 'path'
import Debug from 'debug'

import Loop from './loop'
import * as Model from './model'
import * as Identity from './identity'

const log = Debug('pushpin:workspace')

export function workspaceSeeBoardId(state, { docId }) {
  if (!state.workspace) {
    log('workspaceSeeBoardId called with no workspace!')
    // maybe this should be a more violent error
    return state
  }

  const workspace = state.hm.change(state.workspace, (workspace) => {
    let library = state.workspace.seenBoardIds || []
    const seenDocIndex = library.findIndex(d => d === docId)

    if (Number.isInteger(seenDocIndex)) {
      library = [docId,
        ...library.slice(0, seenDocIndex),
        ...library.slice(seenDocIndex + 1)]
    } else {
      library = [docId, ...library]
    }

    workspace.seenBoardIds = library
  })

  return { ...state, workspace }
}

/* The current workspace ID is stored in a JSON file to boot strap the system. */
function saveWorkspaceId(state, { docId }) {
  const workspaceIdFile = { workspaceDocId: docId }

  Fs.writeFileSync(workspaceIdFilePath(), JSON.stringify(workspaceIdFile))

  return state
}

function workspaceIdFilePath() {
  return Path.join(Model.USER_PATH, 'workspace-id.json')
}

export function getWorkspaceIdFile() {
  if (Fs.existsSync(workspaceIdFilePath())) {
    return JSON.parse(Fs.readFileSync(workspaceIdFilePath()))
  }
  return {}
}

export function addAuthorsToContacts(state) {
  const incomingContacts = state.board.authorIds
  const { selfId, contactIds } = state.workspace

  // #accidentallyQuadratic?
  const oldContactsSet = new Set(contactIds)
  const addedContacts = incomingContacts.filter(contactId =>
    (!oldContactsSet.has(contactId) && contactId !== selfId))

  if (addedContacts.length > 0) {
    const workspace = state.hm.change(state.workspace, (w) => {
      // this is probably not very conflict avoidey: talk to Martin?
      w.contactIds.push(...addedContacts)
    })

    addedContacts.forEach((contactId) => Loop.dispatch(Model.openDocument, { docId: contactId }))
    return { ...state, workspace }
  }

  // nothing added, nothing to do
  return state
}


export function newWorkspace(state) {
  const workspace = state.hm.create()
  const docId = state.hm.getId(workspace)

  Loop.dispatch(saveWorkspaceId, { docId })

  const nextWorkspace = state.hm.change(workspace, (ws) => {
    ws.selfId = ''
    ws.seenBoardIds = []
    ws.offeredIds = []
    ws.contactIds = []
  })

  // should these be synchronous? does it matter?
  Loop.dispatch(Identity.newIdentity)
  Loop.dispatch(Model.newDocument)

  return { ...state, workspace: nextWorkspace }
}

export function updateWorkspaceSelf(state, { selfId }) {
  const nextWorkspace = state.hm.change(state.workspace, (w) => {
    w.selfId = selfId
  })

  return { ...state, workspace: nextWorkspace }
}

export function updateWorkspaceRequestedBoardId(state, { boardId }) {
  const nextWorkspace = state.hm.change(state.workspace, (w) => {
    w.boardId = boardId
  })

  return { ...state, workspace: nextWorkspace }
}

// this is really like... workspaceOnIdentityUpdated()
export function identityUpdated(state, { contactId }) {
  log('identityUpdated.start', contactId)
  if (!(state.contacts && state.contacts[contactId] &&
        state.contacts[contactId].offeredIds)) {
    log('identityUpdated.short', state.contacts)
    return state
  }

  // we'll iterate changes for each new offer onto the workspace
  let { workspace } = state
  const offeredIds = state.contacts[contactId].offeredIds[state.workspace.selfId] || []

  log('identityUpdated.iterate', offeredIds)
  offeredIds.forEach((offeredId) => {
    Loop.dispatch(Model.openDocument, { docId: offeredId })
    workspace = state.hm.change(workspace, (ws) => {
      const offeredIdsSet = new Set(ws.offeredIds)
      if (!offeredIdsSet.has(offeredId)) {
        ws.offeredIds.push({ offeredId, offererId: contactId })
        Loop.dispatch(Model.openDocument, { docId: offeredId })
      }
    })
  })
  return { ...state, workspace }
}
