
import Debug from 'debug'
// import Loop from './loop'
import * as Workspace from './workspace'
import * as Model from './model'

const log = Debug('pushpin:identity')

export function create(state) {
  const identity = state.hm.create()
  const selfId = state.hm.getId(identity)

  const newState = Workspace.updateSelfId(state, { selfId })

  const nextIdentity = newState.hm.change(identity, (i) => {
    i.name = `The Mysterious ${Model.USER}`
    i.docId = selfId
  })

  return { ...newState, self: nextIdentity }
}

export function updateSelfName(state, { name }) {
  const nextIdentity = state.hm.change(state.self, (i) => {
    i.name = name
  })
  return { ...state, self: nextIdentity }
}

export function updateSelfAvatar(state, { avatar }) {
  const nextIdentity = state.hm.change(state.self, (i) => {
    i.avatar = avatar
  })
  return { ...state, self: nextIdentity }
}

export function updateSelfOfferDocumentToIdentity(state, { identityId, sharedDocId }) {
  log('updateSelfOfferDocumentToIdentity.start', identityId, sharedDocId)
  const self = state.hm.change(state.self, (s) => {
    if (!s.offeredIds) {
      s.offeredIds = {}
    }

    if (!s.offeredIds[identityId]) {
      s.offeredIds[identityId] = []
    }

    s.offeredIds[identityId].push(sharedDocId)
  })
  log('updateSelfOfferDocumentToIdentity.newSelf', self)
  return { ...state, self }
}
