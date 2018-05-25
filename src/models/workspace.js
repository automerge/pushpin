import Fs from 'fs'
import Debug from 'debug'

import Loop from '../loop'
import * as Model from './model'

import BoardComponent from '../components/board'
import * as Identity from './identity'
import { WORKSPACE_ID_PATH } from '../constants'

const log = Debug('pushpin:workspace')

export function create(state) {
  let workspace = state.hm.create()
  const docId = state.hm.getId(workspace)

  Loop.dispatch(saveWorkspaceId, { docId })

  workspace = state.hm.change(workspace, (ws) => {
    ws.selfId = ''
    ws.seenBoardIds = []
    ws.offeredIds = []
    ws.contactIds = []
  })

  const identity = state.hm.create()
  const selfId = state.hm.getId(identity)
  const nextIdentity = state.hm.change(identity, (i) => {
    i.name = `The Mysterious ${Model.USER}`
    i.docId = selfId
  })

  const doc = state.hm.create()
  const onChange = function onChange(cb) {
    state.hm.change(doc, cb)
  }

  const boardId = state.hm.getId(doc)
  workspace = state.hm.change(workspace, (ws) => {
    ws.boardId = boardId
    ws.selfId = selfId
  })

  BoardComponent.initializeDocument(onChange, { selfId })

  return { ...state, workspace }
}

export function updateSeenBoardIds(state, { docId }) {
  if (!state.workspace) {
    log('updateSeenBoardIdsIfNeeded called with no workspace!')
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

export function updateContactIds(state, { candidateContactIds }) {
  const { selfId, contactIds } = state.workspace

  // #accidentallyQuadratic?
  const oldContactsSet = new Set(contactIds)
  const addedContacts = candidateContactIds.filter(contactId =>
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

export function updateSelfId(state, { selfId }) {
  const nextWorkspace = state.hm.change(state.workspace, (w) => {
    w.selfId = selfId
  })

  return { ...state, workspace: nextWorkspace }
}

export function updateBoardId(state, { boardId }) {
  const nextWorkspace = state.hm.change(state.workspace, (w) => {
    w.boardId = boardId
  })

  // should we be responsbile for opening the new board here? cc//choxi

  return { ...state, workspace: nextWorkspace }
}

/**
 * we listen to Identity documents to see if anyone has initiated a share with us
 */
export function onIdentityUpdated(state, { contactId }) {
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

/**
 * We bootstrap off the workspace ID, and these functions deal with the JSON file for that.
 */
function saveWorkspaceId(state, { docId }) {
  const workspaceIdFile = { workspaceDocId: docId }

  Fs.writeFileSync(WORKSPACE_ID_PATH, JSON.stringify(workspaceIdFile))

  return state
}

export function getBootstrapWorkspaceId() {
  if (Fs.existsSync(WORKSPACE_ID_PATH)) {
    const json = JSON.parse(Fs.readFileSync(WORKSPACE_ID_PATH))
    if (json.workspaceDocId) {
      return json.workspaceDocId
    }
  }
  return ''
}
