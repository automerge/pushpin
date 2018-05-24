
import Debug from 'debug'
import { EventEmitter } from 'events'
import Path from 'path'

import Loop from '../loop'
import Hypermerge from '../hypermerge'
import * as Workspace from './workspace'
import * as Board from './board'

const log = Debug('pushpin:model')


// ## Constants
export const CARD_COLORS = {
  SNOW: '#ffffff',
  BEIGE: '#cbc5b5',
  SKY: '#8edce6',
  VIOLET: '#a98fdc',
  PINK: '#ff87a1',
  HERB: '#b5e6a1',
  PEACH: '#ff7868',
  CLOUD: '#e5ebf3',
}

export const USER = process.env.NAME || 'userA'
export const USER_PATH = Path.join('.', 'data', USER)
const HYPERMERGE_PATH = Path.join(USER_PATH, 'hypermerge')

// It's normal for a document with a lot of participants to have a lot of
// connections, so increase the limit to avoid spurious warnings about
// emitter leaks.
EventEmitter.defaultMaxListeners = 100

// ## Initial state. Evolved by actions below.
export const empty = {
  formDocId: '',
  selected: [],
  workspace: null,
  board: null,
  self: null,
  contacts: {},
  hm: null,
  docs: {}
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

  if (state.workspace.selfId === docId) {
    return { ...state, self: doc }
  }

  if (state.workspace.offeredIds.map(o => o.offeredId).includes(docId)) {
    const offeredDocs = state.offeredDocs || {}
    offeredDocs[docId] = doc
    state = { ...state, offeredDocs }
  }

  if (state.board && state.board.cards) {
    const cardDocIds = Object.values(state.board.cards).map(c => c.docId)
    let newDocs = state.docs

    if (cardDocIds.includes(docId)) {
      newDocs = { ...newDocs, [docId]: doc }
      state = { ...state, docs: newDocs }
    }
  }

  if (state.workspace.boardId === docId) {
    // Case where we've created or opened the requested doc.
    // It may be an unitialized board in which case we need to populate it.
    // these two properties are not part of the workspace document because they
    // represent transient application state, not something we save.
    state = { ...state,
      formDocId: docId,
      board: doc
    }

    if (!state.board.cards) {
      log('documentReady.populateStart', state)
      state = Board.populateDemoBoard(state)
      log('documentReady.populateFinish', state)
    }

    state = Board.addSelfToAuthors(state)
    state = Workspace.updateContactIds(
      state,
      { candidateContactIds: state.board.authorIds }
    )
    state = Workspace.updateSeenBoardIds(state, { docId })

    Object.values(state.board.cards).forEach(c => {
      Loop.dispatch(openDocument, { docId: c.docId })
    })
  }

  const contactIds = state.workspace && state.workspace.contactIds ?
    state.workspace.contactIds : []
  if (contactIds.includes(docId)) {
    return { ...state, contacts: { ...state.contacts, [docId]: doc } }
  }

  return state
}

export function documentUpdated(state, { docId, doc }) {
  switch (docId) {
    /* we probably need to think about the old activeDocId thing to avoid bugs */
    case (state.requestedWorkspace):
      return { ...state, workspace: doc }
    case (state.workspace.selfId): // this is a race, since workspace can be null :(
      return { ...state, self: doc }
    case (state.workspace.boardId): // same here
      // XXX: horrifying hack -- this didn't trigger at first. why?
      Loop.dispatch(Workspace.updateContactIds, { candidateContactIds: doc.authorIds })
      return { ...state, board: doc }
    default:
      break
  }

  const cardDocIds = state.board && state.board.cards ?
    Object.values(state.board.cards).map(c => c.docId) : []
  if (cardDocIds.includes(docId)) {
    const newDocs = { ...state.docs, [docId]: doc }
    return { ...state, docs: newDocs }
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

export function formChanged(state, { docId }) {
  return { ...state, formDocId: docId }
}

export function formSubmitted(state) {
  Loop.dispatch(openDocument, { docId: state.formDocId })
  Loop.dispatch(Workspace.updateBoardId, { boardId: state.formDocId })

  return state
}

export function openAndRequestBoard(state, { docId }) {
  Loop.dispatch(openDocument, { docId })
  Loop.dispatch(Workspace.updateBoardId, { boardId: docId })

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
