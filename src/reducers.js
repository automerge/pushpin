import { Map, List } from 'immutable'

import { INITIALIZE_IF_EMPTY, CARD_DRAG_STOPPED, CARD_RESIZED, CARD_RESIZE_STOPPED } from './action-types'

const GRID_SIZE = 5

const RootState = new Map({
  cards: new Map()
})

function snapTo(num, gridSize) {
  var resto = num % gridSize
  if (resto <= (gridSize / 2)) { 
    return num - resto
  } else {
    return num + gridSize - resto
  }
}

function initializeIfEmpty(state) {
  return state.update('cards', (cards) => {
    return cards
      .set('1', new Map({id: '1', text: 'first card',  width: 200, height: 150, x: 50,  y: 50}))
      .set('2', new Map({id: '2', text: 'second card', width: 200, height: 150, x: 200, y: 400}))
      .set('3', new Map({id: '3', text: 'third card',  width: 200, height: 150, x: 400, y: 200}))
  })
}

function cardDragStopped(state, id, x, y) {
  const snapX = snapTo(x, GRID_SIZE)
  const snapY = snapTo(y, GRID_SIZE)
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('x', snapX)
      .set('y', snapY)
  })
}

function cardResized(state, id, width, height) {
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('width', width)
      .set('height', height)
  })
}



function cardResizeStopped(state, id, width, height) {
  const snapWidth = snapTo(width, GRID_SIZE)
  const snapHeight = snapTo(height, GRID_SIZE)
  return cardResized(state, id, snapWidth, snapHeight)
}

function Reducer(state, action) {
  console.log(action)

  switch (action.type) {
    case INITIALIZE_IF_EMPTY:
      return initializeIfEmpty(state);
    
    case CARD_DRAG_STOPPED:
      return cardDragStopped(state, action.id, action.x, action.y)

    case CARD_RESIZED:
      return cardResized(state, action.id, action.width, action.height)

    case CARD_RESIZE_STOPPED:
      return cardResizeStopped(state, action.id, action.width, action.height)

    case '@@redux/INIT':
      return state;

    default:
      throw new Error(`Unkonwn action: ${action.type}`);
  }
}

export { RootState, Reducer };
