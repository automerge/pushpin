import { Map, List } from 'immutable'

import { INITIALIZE_IF_EMPTY, CARD_RESIZED, CARD_DRAG_STOPPED } from './action-types'

const RootState = new Map({
  cards: new Map()
})

function initializeIfEmpty(state) {
  return state.update('cards', (cards) => {
    return cards
      .set('1', new Map({id: '1', text: 'first card',  width: 150, height: 100, x: 50,  y: 50}))
      .set('2', new Map({id: '2', text: 'second card', width: 150, height: 100, x: 200, y: 400}))
      .set('3', new Map({id: '3', text: 'third card',  width: 150, height: 100, x: 400, y: 200}))
  })
}

function cardDragStopped(state, id, x, y) {
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('x', x)
      .set('y', y)
  })
}

function cardResized(state, id, width, height, x, y) {
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('width', width)
      .set('height', height)
      .set('x', x)
      .set('y', y)
  })
}

function Reducer(state, action) {
  console.log(action)

  switch (action.type) {
    case INITIALIZE_IF_EMPTY:
      return initializeIfEmpty(state);
    
    case CARD_DRAG_STOPPED:
      return cardDragStopped(state, action.id, action.x, action.y)

    case CARD_RESIZED:
      return cardResized(state, action.id, action.width, action.height, action.x, action.y)

    case '@@redux/INIT':
      return state;

    default:
      throw new Error(`Unkonwn action: ${action.type}`);
  }
}

export { RootState, Reducer };
