import * as Board from './board'

export function cardCreatedText(state, { x, y, selected, text }) {
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

export function cardTextResized(state, { id, height }) {
  const newBoard = Board.changeBoard(state, (b) => {
    const card = b.cards[id]
    // Ensure text doesn't stick out of the bottom of card.
    card.height = Board.snapMeasureOutwardToGrid(height)
  })
  return { ...state, board: newBoard }
}
