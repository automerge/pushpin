import * as Board from './board'

export function create(state, { x, y, selected, text }) {
  return Board.cardCreated(state, { x, y, selected, type: 'text', typeAttrs: { text } })
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
