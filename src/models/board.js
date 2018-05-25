import uuid from 'uuid/v4'

import * as Workspace from './workspace'

// Board constants

export const GRID_SIZE = 24

export const CARD_DEFAULT_WIDTH = 337
export const CARD_DEFAULT_HEIGHT = 97
export const CARD_MIN_WIDTH = 97
export const CARD_MIN_HEIGHT = 49

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

/**
 *
 * Card placement / manipulation actions
 *
 */

export function cardMoved(onChange, doc, { id, x, y }) {
  // This gets called when uniqueyly selecting a card, so avoid a document
  // change if in fact the card hasn't moved mod snapping.
  const snapX = snapCoordinateToGrid(x)
  const snapY = snapCoordinateToGrid(y)
  if (snapX === doc.cards[id].x && snapY === doc.cards[id].y) {
    return
  }
  onChange((b) => {
    const card = b.cards[id]
    card.x = snapX
    card.y = snapY
  })
}

export function cardResizeHeightRoundingUp(onChange, doc, { id, width, height }) {
  const snapHeight = snapMeasureOutwardToGrid(Math.max(height, CARD_MIN_HEIGHT))
  onChange((b) => {
    const card = b.cards[id]
    card.height = snapHeight
  })
}

export function cardResized(onChange, doc, { id, width, height }) {
  // This gets called when we click the drag corner of a card, so avoid a
  // document change if in fact the card won't resize mod snapping.
  const snapWidth = snapMeasureToGrid(width)
  const snapHeight = snapMeasureToGrid(height)
  if (snapWidth === doc.cards[id].width && doc.cards[id].height) {
    return
  }
  onChange((b) => {
    const card = b.cards[id]
    card.width = snapWidth
    card.height = snapHeight
  })
}

export function cardDeleted(onChange, doc, { id }) {
  // allow either an array or a single card to be passed in
  if (id.constructor !== Array) {
    id = [id]
  }

  onChange((b) => {
    id.forEach((id) => delete b.cards[id])
  })
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

export function snapCoordinateToGrid(coordinate) {
  return snapToGrid(coordinate)
}

export function snapMeasureToGrid(measure) {
  return snapToGrid(measure) + 1
}

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
  const newBoard = state.hm.change(state.board, (b) => {
    b.title = title
  })
  return { ...state, board: newBoard }
}

export function newSetBackgroundColor(onChange, doc, { backgroundColor }) {
  onChange((b) => {
    b.backgroundColor = backgroundColor
  })
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


export function cardCreated(state, { x, y, width, height, type, docId, doc }) {
  const id = uuid()

  const newBoard = state.hm.change(state.board, (b) => {
    const snapX = snapCoordinateToGrid(x)
    const snapY = snapCoordinateToGrid(y)
    const newCard = {
      id,
      type,
      docId,
      x: snapX,
      y: snapY,
      width: snapMeasureToGrid(width || CARD_DEFAULT_WIDTH),
      height: snapMeasureToGrid(height || CARD_DEFAULT_HEIGHT),
      slackWidth: 0,
      slackHeight: 0,
      resizing: false,
      moving: false,
    }
    b.cards[id] = newCard
  })

  let newDocs = state.docs
  newDocs = { ...newDocs, [docId]: doc }

  return { ...state, docs: newDocs, board: newBoard }
}

export function addCard(state, { x, y, contentType, args, selected }) {
  let doc = state.hm.create()
  const docId = state.hm.getId(doc)

  doc = state.hm.change(doc, (doc) => { contentType.initialize(doc, args) })

  return cardCreated(state, { x, y, type: contentType.type, selected, docId, doc })
}
