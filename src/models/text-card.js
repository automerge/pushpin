import * as Board from './board'
import Loop from '../loop'
import Automerge from 'automerge'

export function create(state, { x, y, selected, text }) {
  let doc = state.hm.create()
  doc = state.hm.change(doc, d => {
    d.text = new Automerge.Text()
    d.text.insertAt(0, ...text.split(''))
  })
  const docId = state.hm.getId(doc)

  Loop.dispatch(Board.cardCreated, { x, y, selected, type: 'text', typeAttrs: { doc, docId } })

  return state
}

export function cardTextChanged(state, { id, at, removedLength, addedText }) {
  const newBoard = Board.changeBoard(state, (b) => {
    const { text } = b.cards[id]

    if (removedLength > 0) {
      text.splice(at, removedLength)
    }

    if (addedText.length > 0) {
      text.insertAt(at, ...addedText.split(''))
    }
  })
  return { ...state, board: newBoard }
}
