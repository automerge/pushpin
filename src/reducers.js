import { Map, List } from 'immutable'
import { EditorState } from 'draft-js'
import uuid from 'uuid/v4'
import { INITIALIZE_IF_EMPTY, CARD_CREATED, CARD_DRAG_STOPPED, CARD_RESIZE_STOPPED, CARD_EDITOR_CHANGED, CARD_SELECTED, CLEAR_SELECTIONS} from './action-types'

const GRID_SIZE = 5
const CARD_DEFAULT_WIDTH = 200
const CARD_DEFAULT_HEIGHT = 150

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

function snapToGrid(num) {
  return snapTo(num, GRID_SIZE)
}

function initializeIfEmpty(state) {
  state = cardCreated(state, 50, 50, false)
  state = cardCreated(state, 200, 400, false)
  state = cardCreated(state, 400, 200, false)
  const id = uuid()
  state = state.setIn(['cards', id], new Map({
    id: id,
    type: 'image',
    x: 750,
    y: 100,
    width: (900/3),
    height: (750/3),
    selected: false,
    path: '../img/kay.jpg'
  }))
  return state
}

function cardCreated(state, x, y, selected) {
  const id = uuid()
  const snapX = snapToGrid(x)
  const snapY = snapToGrid(y)
  state = state.setIn(['cards', id], new Map({
    id: id,
    type: 'text',
    x: snapX,
    y: snapY,
    width: CARD_DEFAULT_WIDTH,
    height: CARD_DEFAULT_HEIGHT,
    selected: false,
    editorState: EditorState.createEmpty()
  }))
  if (selected) {
    state = cardSelected(state, id)
  }
  return state
}

function cardDragStopped(state, id, x, y) {
  const snapX = snapToGrid(x)
  const snapY = snapToGrid(y)
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('x', snapX)
      .set('y', snapY)
  })
}

function cardResizeStopped(state, id, width, height) {
  const snapWidth = snapToGrid(width)
  const snapHeight = snapToGrid(height)
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('width', snapWidth)
      .set('height', snapHeight)
  })
}

function cardEditorChanged(state, id, editorState) {
  return state.setIn(['cards', id, 'editorState'], editorState)
}

function cardSelected(state, id) {
  return state.setIn(['cards', id, 'selected'], true)
}

function clearSelections(state) {
  state.get('cards').forEach((card, idx) => {
    if (card.get('selected')) {
      state = state.setIn(['cards', idx, 'selected'], false)
    }
  })
  return state
}

function Reducer(state, action) {
  console.log(action)

  switch (action.type) {
    case INITIALIZE_IF_EMPTY:
      return initializeIfEmpty(state);

    case CARD_CREATED:
      return cardCreated(state, action.x, action.y, action.selected)

    case CARD_DRAG_STOPPED:
      return cardDragStopped(state, action.id, action.x, action.y)

    case CARD_RESIZE_STOPPED:
      return cardResizeStopped(state, action.id, action.width, action.height)

    case CARD_EDITOR_CHANGED:
      return cardEditorChanged(state, action.id, action.editorState)

    case CARD_SELECTED:
      return cardSelected(state, action.id)

    case CLEAR_SELECTIONS:
      return clearSelections(state)

    case '@@redux/INIT':
      return state;

    default:
      throw new Error(`Unkonwn action: ${action.type}`);
  }
}

export { RootState, Reducer };
