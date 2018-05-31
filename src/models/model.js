import { EventEmitter } from 'events'
import Fs from 'fs'
import Debug from 'debug'

import Loop from '../loop'
import Hypermerge from '../hypermerge'
import { HYPERMERGE_PATH, WORKSPACE_ID_PATH, USER } from '../constants'
import BoardComponent from '../components/board'

const log = Debug('pushpin:model')

// It's normal for a document with a lot of participants to have a lot of
// connections, so increase the limit to avoid spurious warnings about
// emitter leaks.
EventEmitter.defaultMaxListeners = 100

// ## Initial state.
export const empty = {
  workspace: null,
  contacts: {}
}

// Starts IO subsystems and populates associated state.
export function init(state) {
  const hm = new Hypermerge({ storage: HYPERMERGE_PATH, port: 0 })
  window.hm = hm

  const requestedWorkspace = getBootstrapWorkspaceId() || ''

  hm.once('ready', () => {
    hm.joinSwarm()

    hm.on('document:ready', (docId, doc) => {
      Loop.dispatch(documentReady, { docId, doc })
    })

    hm.on('document:updated', (docId, doc) => {
      Loop.dispatch(documentUpdated, { docId, doc })
    })

    if (requestedWorkspace === '') {
      Loop.dispatch(createWorkspace)
    } else {
      Loop.dispatch(openDocument, { docId: requestedWorkspace })
    }
  })

  return { ...state, requestedWorkspace }
}

function documentReady(state, { docId, doc }) {
  if (state.requestedWorkspace === docId) {
    // TODO: this should be a thing that is listening on the workspace document
    // xxx: move this somewhere else?
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

  const contactIds = state.workspace && state.workspace.contactIds ?
    state.workspace.contactIds : []
  if (contactIds.includes(docId)) {
    return { ...state, contacts: { ...state.contacts, [docId]: doc } }
  }

  return state
}

function documentUpdated(state, { docId, doc }) {
  if (docId === state.requestedWorkspace) {
    return { ...state, workspace: doc }
  }

  if (state.workspace && (docId === state.workspace.boardId)) {
    return state
  }

  const contactIds = state.workspace && state.workspace.contactIds ?
    state.workspace.contactIds : []
  if (contactIds.includes(docId)) {
    Loop.dispatch(onIdentityUpdated, { contactId: docId })
    return { ...state, contacts: { ...state.contacts, [docId]: doc } }
  }

  return state
}

/* The hypermerge interface is awesome! *ahem* */
function openDocument(state, { docId }) {
  window.hm.open(docId)
    .then(doc => {
      Loop.dispatch(documentReady, { doc, docId })
    })

  return state
}

function createWorkspace(state) {
  let workspace = window.hm.create()
  const docId = window.hm.getId(workspace)

  Loop.dispatch(saveWorkspaceId, { docId })

  workspace = window.hm.change(workspace, (ws) => {
    ws.selfId = ''
    ws.offeredIds = []
    ws.contactIds = []
  })

  const identity = window.hm.create()
  const selfId = window.hm.getId(identity)
  window.hm.change(identity, (i) => {
    i.name = `The Mysterious ${USER}`
    i.docId = selfId
  })

  const doc = window.hm.create()
  const onChange = function onChange(cb) {
    window.hm.change(doc, cb)
  }

  const boardId = window.hm.getId(doc)
  workspace = window.hm.change(workspace, (ws) => {
    ws.boardId = boardId
    ws.selfId = selfId
  })

  BoardComponent.initializeDocument(onChange)

  return { ...state, workspace }
}

/**
 * we listen to Identity documents to see if anyone has initiated a share with us
 */
function onIdentityUpdated(state, { contactId }) {
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
    Loop.dispatch(openDocument, { docId: offeredId })
    workspace = window.hm.change(workspace, (ws) => {
      const offeredIdsSet = new Set(ws.offeredIds)
      if (!offeredIdsSet.has(offeredId)) {
        ws.offeredIds.push({ offeredId, offererId: contactId })
        Loop.dispatch(openDocument, { docId: offeredId })
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

function getBootstrapWorkspaceId() {
  if (Fs.existsSync(WORKSPACE_ID_PATH)) {
    const json = JSON.parse(Fs.readFileSync(WORKSPACE_ID_PATH))
    if (json.workspaceDocId) {
      return json.workspaceDocId
    }
  }
  return ''
}
