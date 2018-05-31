import Debug from 'debug'
import { EventEmitter } from 'events'

import Loop from '../loop'
import Hypermerge from '../hypermerge'
import * as Workspace from './workspace'
import { HYPERMERGE_PATH } from '../constants'

const log = Debug('pushpin:model')

// It's normal for a document with a lot of participants to have a lot of
// connections, so increase the limit to avoid spurious warnings about
// emitter leaks.
EventEmitter.defaultMaxListeners = 100

// ## Initial state.
export const empty = {
  workspace: null,
  board: null,
  contacts: {},
  hm: null
}

// Starts IO subsystems and populates associated state.
export function init(state) {
  const hm = new Hypermerge({ storage: HYPERMERGE_PATH, port: 0 })
  window.hm = hm

  const requestedWorkspace = Workspace.getBootstrapWorkspaceId() || ''

  hm.once('ready', () => {
    hm.joinSwarm()

    hm.on('document:ready', (docId, doc) => {
      Loop.dispatch(documentReady, { docId, doc })
    })

    hm.on('document:updated', (docId, doc) => {
      Loop.dispatch(documentUpdated, { docId, doc })
    })

    if (requestedWorkspace === '') {
      Loop.dispatch(Workspace.create)
    } else {
      Loop.dispatch(openDocument, { docId: requestedWorkspace })
    }
  })

  return { ...state, hm, requestedWorkspace }
}

export function documentReady(state, { docId, doc }) {
  if (state.requestedWorkspace === docId) {
    // TODO: this should be a thing that is listening on the workspace document
    // xxx: move this somewhere else?
    Loop.dispatch(openDocument, { docId: doc.boardId })
    Loop.dispatch(openDocument, { docId: doc.selfId })

    if (doc.contactIds) {
      doc.contactIds.forEach((id) => {
        Loop.dispatch(openDocument, { docId: id })
      })
    }

    return { ...state, workspace: doc }
  }

  if (!state.workspace) {
    return state
  }

  if (state.workspace.offeredIds.map(o => o.offeredId).includes(docId)) {
    const offeredDocs = state.offeredDocs || {}
    offeredDocs[docId] = doc
    state = { ...state, offeredDocs }
  }

  if (state.workspace.boardId === docId) {
    state = { ...state, board: doc }
    state = Workspace.updateSeenBoardIds(state, { docId })
  }

  const contactIds = state.workspace && state.workspace.contactIds ?
    state.workspace.contactIds : []
  if (contactIds.includes(docId)) {
    return { ...state, contacts: { ...state.contacts, [docId]: doc } }
  }

  return state
}

export function documentUpdated(state, { docId, doc }) {
  if (docId === state.requestedWorkspace) {
    return { ...state, workspace: doc }
  } else if (state.workspace) {
    if (docId === state.workspace.boardId) {
      return { ...state, board: doc }
    }
  }

  const contactIds = state.workspace && state.workspace.contactIds ?
    state.workspace.contactIds : []
  if (contactIds.includes(docId)) {
    Loop.dispatch(Workspace.onIdentityUpdated, { contactId: docId })
    return { ...state, contacts: { ...state.contacts, [docId]: doc } }
  }

  // this won't work with invitations, since presumably they are not yet in your seenBoardIds
  const seenBoardIds = state.workspace && state.workspace.seenBoardIds ?
    state.workspace.seenBoardIds : []
  if (seenBoardIds.includes(docId)) {
    return { ...state, boards: { ...state.boards, [docId]: doc } }
  }

  // what's all this, then? how did we get here?
  log('somehow we loaded a document we know nothing about', docId, doc)
  return state
}

/* The hypermerge interface is awesome! *ahem* */
export function openDocument(state, { docId }) {
  state.hm.open(docId)
    .then(doc => {
      Loop.dispatch(documentReady, { doc, docId })
    })

  return state
}
