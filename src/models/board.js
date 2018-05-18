import uuid from 'uuid/v4'
import Automerge from 'automerge'

import Loop from '../loop'
import * as Workspace from './workspace'
import * as ImageCard from './image-card'
import * as TextCard from './text-card'

// Board constants

export const BOARD_COLORS = {
  SNOW: '#f9f9f9',
  BEIGE: '#f3f1ec',
  SKY: '#dcf3f6',
  VIOLET: '#e5dcf6',
  PINK: '#ffe1e7',
  HERB: '#daefd2',
  PEACH: '#ffd2cc',
  CLOUD: '#d5dfe5',
}
export const BOARD_WIDTH = 3600
export const BOARD_HEIGHT = 1800
export const GRID_SIZE = 24

export const CARD_DEFAULT_WIDTH = 337
export const CARD_DEFAULT_HEIGHT = 97
export const CARD_MIN_WIDTH = 97
export const CARD_MIN_HEIGHT = 49
export const RESIZE_HANDLE_SIZE = 21

export function create(state) {
  const doc = state.hm.create()
  const boardId = state.hm.getId(doc)

  // hmmm. any thoughts on how to do this idiomatically?
  const newState = Workspace.updateBoardId(state, { boardId })

  // refactor in progress: the requestedDocId is now called workspace.boardId
  return {
    ...newState,
    formDocId: boardId
  }
}

// ## Demo data

const WELCOME_TEXT =
`## Welcome

This is our demo board!`

const USAGE_TEXT =
`### Usage

* Double-click to create a new text card.
* Right-click to create a new text or image card.
* Click on a card to edit its text.
* Write Markdown in cards for formatting.
* Click and drag anywhere on a card to move it around.
* Click and drag on the bottom right corner of a card to resize it.
* Paste an absolute file name to an image as the only text in a card + hit enter, to load that file.
* Use arrow keys to scroll around the board.`

const EXAMPLE_TEXT =
`### Example data

We've made some initial cards for you to play with. Have fun!`

const KAY_PATH = './img/kay.jpg'
const WORKSHOP_PATH = './img/carpenters-workshop.jpg'

// this really should not need exporting
export function populateDemoBoard(state) {
  if (state.board.cards) {
    throw new Error('Should only be called on an empty board')
  }
  // not sure if this is an antipattern
  const boardDocId = state.hm.getId(state.board)
  const newBoard = changeBoard(state, (b) => {
    b.docId = boardDocId
    b.cards = {}
    b.authorIds = []
  })
  let newState = { ...state, board: newBoard }
  newState = TextCard.create(newState, { x: 1350, y: 100, text: WELCOME_TEXT })
  newState = TextCard.create(newState, { x: 1350, y: 250, text: USAGE_TEXT })
  newState = TextCard.create(newState, { x: 1350, y: 750, text: EXAMPLE_TEXT })

  newState = setTitle(newState, { title: 'Example Board' })
  newState = setBackgroundColor(newState, { backgroundColor: BOARD_COLORS.SKY })

  newState = addSelfToAuthors(newState)

  // These will be handled async as they require their own IO.
  Loop.dispatch(ImageCard.importImageThenCreate, { x: 1750, y: 500, path: KAY_PATH })
  Loop.dispatch(ImageCard.importImageThenCreate, { x: 1800, y: 150, path: WORKSHOP_PATH })

  return newState
}

// Helper for state.hm.change so that it's easier to insert debugging.
// still used by text-card.js#cardTextChanged (at least)
export function changeBoard(state, changeFn) {
  return state.hm.change(state.board, changeFn)
}

/**
 *
 * Selection management actions
 *
 */
export function cardToggleSelection(state, { id }) {
  if (state.selected.includes(id)) {
    return { ...state, selected: state.selected.filter((filterId) => filterId !== id) }
  }
  return { ...state, selected: [...state.selected, id] }
}

export function cardSelected(state, { id }) {
  // allow either an array or a single card to be passed in
  if (id.constructor !== Array) {
    id = [id]
  }
  return { ...state, selected: [...state.selected, ...id] }
}

export function cardUniquelySelected(state, { id }) {
  return { ...state, selected: [id] }
}

export function clearSelections(state) {
  return { ...state, selected: [] }
}

export function deleteSelections(state) {
  // backspace on the board can't erase a single text card
  if (state.selected.length === 1) {
    const card = state.board.cards[state.selected[0]]
    if (card && card.type === 'text') {
      return state
    }
  }

  // still inefficient, but better
  const deleteCardIDs = Object.keys(state.board.cards)
    .filter((id) => (state.selected.includes(id)))

  state = deleteCardIDs.reduce((state, id) => (cardDeleted(state, { id })), state)

  return state
}

/**
 *
 * Card placement / manipulation actions
 *
 */

export function cardMoved(state, { id, x, y }) {
  // This gets called when uniqueyly selecting a card, so avoid a document
  // change if in fact the card hasn't moved mod snapping.
  const snapX = snapCoordinateToGrid(x)
  const snapY = snapCoordinateToGrid(y)
  if (snapX === state.board.cards[id].x && snapY === state.board.cards[id].y) {
    return state
  }
  const newBoard = changeBoard(state, (b) => {
    const card = b.cards[id]
    card.x = snapX
    card.y = snapY
  })
  return { ...state, board: newBoard }
}

export function cardResizeHeightRoundingUp(state, { id, width, height }) {
  const snapHeight = snapMeasureOutwardToGrid(Math.max(height, CARD_MIN_HEIGHT))
  const board = changeBoard(state, (b) => {
    const card = b.cards[id]
    card.height = snapHeight
  })
  return { ...state, board }
}

export function cardResized(state, { id, width, height }) {
  // This gets called when we click the drag corner of a card, so avoid a
  // document change if in fact the card won't resize mod snapping.
  const snapWidth = snapMeasureToGrid(width)
  const snapHeight = snapMeasureToGrid(height)
  if (snapWidth === state.board.cards[id].width && snapHeight === state.board.cards[id].height) {
    return state
  }
  const newBoard = changeBoard(state, (b) => {
    const card = b.cards[id]
    card.width = snapWidth
    card.height = snapHeight
  })
  return { ...state, board: newBoard }
}

export function cardDeleted(state, { id }) {
  const newBoard = changeBoard(state, (b) => {
    delete b.cards[id]
  })
  return { ...state, board: newBoard }
}

/**
 *
 * Grid manipulation functions
 *
 */

// Snap given num to nearest multiple of our grid size.
function snapToGrid(num) {
  const resto = num % GRID_SIZE
  if (resto <= (GRID_SIZE / 2)) {
    return num - resto
  }
  return num + GRID_SIZE - resto
}

// We have slightly different snap functions for coordinates (x,y) and
// measures (height, width) because we want the latter to be a bit larger
// than the grid size to allow overlapping boarders of adjacent elements.
// We also have a special variant of the measure snap that ensures it only
// ever increases the measure, which are needed for some types of content
// (like text which shouldn't get cut off by snapping).

function snapCoordinateToGrid(coordinate) {
  return snapToGrid(coordinate)
}

function snapMeasureToGrid(measure) {
  return snapToGrid(measure) + 1
}

// XXX: stop exporting this
export function snapMeasureOutwardToGrid(measure) {
  const snapped = snapMeasureToGrid(measure)
  if (snapped >= measure) {
    return snapped
  }
  return snapped + GRID_SIZE
}

/**
 *
 * Board metadata stuff
 *
 */

export function setTitle(state, { title }) {
  const newBoard = changeBoard(state, (b) => {
    b.title = title
  })
  return { ...state, board: newBoard }
}

export function setBackgroundColor(state, { backgroundColor }) {
  const newBoard = changeBoard(state, (b) => {
    b.backgroundColor = backgroundColor
  })
  return { ...state, board: newBoard }
}

export function addSelfToAuthors(state) {
  if (state.board.authorIds.includes(state.workspace.selfId)) {
    return state
  }
  const board = state.hm.change(state.board, (b) => {
    b.authorIds = [...b.authorIds, state.workspace.selfId]
  })
  return { ...state, board }
}

/**
 *
 * Card Creation
 * This stuff needs to be creating subclasses / variations on cards
 * for images / text but we haven't figured that out yet.
 */


export function cardCreated(state, { x, y, width, height, selected, type, typeAttrs }) {
  const id = uuid()

  const newBoard = changeBoard(state, (b) => {
    const snapX = snapCoordinateToGrid(x)
    const snapY = snapCoordinateToGrid(y)
    const newCard = {
      id,
      type,
      x: snapX,
      y: snapY,
      width: snapMeasureToGrid(width || CARD_DEFAULT_WIDTH),
      height: snapMeasureToGrid(height || CARD_DEFAULT_HEIGHT),
      slackWidth: 0,
      slackHeight: 0,
      resizing: false,
      moving: false,
    }

    // Apply type-specific attributes. The difference in sequencing between
    // image and text types is due to weird Automerge interactions that we
    // should revisit later.
    if (type === 'image') {
      b.cards[id] = newCard
      b.cards[id].hyperfile = typeAttrs.hyperfile
    }
    if (type === 'text') {
      b.cards[id] = newCard
      b.cards[id].text = new Automerge.Text()
      b.cards[id].text.insertAt(0, ...typeAttrs.text.split(''))
    }
  })

  const newSelected = selected ? [id] : []

  return { ...state, board: newBoard, selected: newSelected }
}
