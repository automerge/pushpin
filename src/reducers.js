import { Map, List } from 'immutable'
import { EditorState } from 'draft-js'
import uuid from 'uuid/v4'
import { INITIALIZE_IF_EMPTY, CARD_CREATED, CARD_DRAG_STOPPED, CARD_RESIZE_STOPPED, CARD_EDITOR_CHANGED} from './action-types'

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
  return state
}

function cardCreated(state, x, y, focused) {
  const id = uuid()
  const snapX = snapToGrid(x)
  const snapY = snapToGrid(y)
  return state.setIn(['cards', id], new Map({
    id: id,
    x: x,
    y: y,
    width: CARD_DEFAULT_WIDTH,
    height: CARD_DEFAULT_HEIGHT,
    focused: focused,
    editorState: EditorState.createEmpty()
  }))
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

function Reducer(state, action) {
  console.log(action)

  switch (action.type) {
    case INITIALIZE_IF_EMPTY:
      return initializeIfEmpty(state);

    case CARD_CREATED:
      return cardCreated(state, action.x, action.y, action.focused)

    case CARD_DRAG_STOPPED:
      return cardDragStopped(state, action.id, action.x, action.y)

    case CARD_RESIZE_STOPPED:
      return cardResizeStopped(state, action.id, action.width, action.height)

    case CARD_EDITOR_CHANGED:
      return cardEditorChanged(state, action.id, action.editorState)

    case '@@redux/INIT':
      return state;

    default:
      throw new Error(`Unkonwn action: ${action.type}`);
  }
}

export { RootState, Reducer };
