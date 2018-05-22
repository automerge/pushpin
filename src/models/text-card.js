import Automerge from 'automerge'
import Loop from '../loop'

import * as Board from './board'

export function create(state, { x, y, selected, text }) {
  let doc = state.hm.create()
  doc = state.hm.change(doc, d => {
    d.text = new Automerge.Text()
    d.text.insertAt(0, ...text.split(''))
  })
  const docId = state.hm.getId(doc)

  Loop.dispatch(Board.cardCreated, { x, y, selected, type: 'text', docId, doc })

  return state
}

export function cardTextChanged(state, { id, at, removedLength, addedText }) {
  const cardDocId = state.board.cards[id].docId
  const cardDoc = state.hm.change(state.docs[cardDocId], (d) => {
    if (removedLength > 0) {
      d.text.splice(at, removedLength)
    }

    if (addedText.length > 0) {
      d.text.insertAt(at, ...addedText.split(''))
    }
  })

  const docs = { ...state.docs, [cardDocId]: cardDoc }

  return { ...state, docs }
}
