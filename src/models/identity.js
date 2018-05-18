
import Debug from 'debug'
// import Loop from './loop'
import * as Workspace from './workspace'
import * as Model from './model'

const log = Debug('pushpin:identity')

export function create(state) {
  const identity = state.hm.create()
  const selfId = state.hm.getId(identity)

  // hmmm. any thoughts on how to do this idiomatically?
  const newState = Workspace.updateWorkspaceSelf(state, { selfId })

  const nextIdentity = newState.hm.change(identity, (i) => {
    i.name = `The Mysterious ${Model.USER}`
    i.docId = selfId
    i.color = '#4df1c3'
  })

  return { ...newState, self: nextIdentity }
}

export function identitySelfNameChange(state, { name }) {
  const nextIdentity = state.hm.change(state.self, (i) => {
    i.name = name
  })
  return { ...state, self: nextIdentity }
}

export function identitySelfAvatarChange(state, { avatar }) {
  const nextIdentity = state.hm.change(state.self, (i) => {
    i.avatar = avatar
  })
  return { ...state, self: nextIdentity }
}

export function identityOfferDocumentToIdentity(state, { identityId, sharedDocId }) {
  log('identityOfferDocumentToIdentity.start', identityId, sharedDocId)
  const self = state.hm.change(state.self, (s) => {
    if (!s.offeredIds) {
      s.offeredIds = {}
    }

    if (!s.offeredIds[identityId]) {
      s.offeredIds[identityId] = []
    }

    s.offeredIds[identityId].push(sharedDocId)
  })
  log('identityOfferDocumentToIdentity.newSelf', self)
  return { ...state, self }
}
