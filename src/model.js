import uuid from 'uuid/v4'
import Fs from 'fs'
import Path from 'path'
import Jimp from 'jimp'
import Hypermerge from 'hypermerge'
import RAM from 'random-access-memory'
import Debug from 'debug'

import Loop from './loop'

const log = Debug('model')

//// Contants

export const BOARD_WIDTH = 3600
export const BOARD_HEIGHT = 1800
export const GRID_SIZE = 5
export const CARD_DEFAULT_WIDTH = 300
export const CARD_DEFAULT_HEIGHT = 100
export const CARD_MIN_WIDTH = 100
export const CARD_MIN_HEIGHT = 60
export const RESIZE_HANDLE_SIZE = 21

const WELCOME_TEXT =
`## Welcome

This is our board demo!`

const USAGE_TEXT =
`### Usage

* Double-click to create a new text card.
* Right-click to create a new text or image card.
* Click on a card to edit its text.
* Write Markdown in cards for formatting.
* Click and drag anywhere on a card to move it around.
* Click and drag on the bottom right corner of a card to resize it.
* Paste an absolute file name to an image as the only text in a card + hit enter, to load that file.
* Use arrow keys to scroll around the board.
* Press space + move the mouse to scroll around the board.`

const EXAMPLE_TEXT =
`### Example data

We've made some initial cards for you to play with. Have fun!`

// Recognizes absolute local file paths to supported file types.
const filePat = /^\s*(\/\S+\.(jpg|jpeg|png|gif))\n\s*$/


//// Helper functions.

// Pick a resonable initial display scale for an image of given dimensions.
function scaleImage(width, height) {
  const scaledWidth = CARD_DEFAULT_WIDTH
  const scaledHeight = height * (scaledWidth / width)
  return [scaledWidth, scaledHeight]
}

// Snap given num to nearest multiple of our grid size.
export function snapToGrid(num) {
  var resto = num % GRID_SIZE
  if (resto <= (GRID_SIZE / 2)) {
    return num - resto
  } else {
    return num + GRID_SIZE - resto
  }
}



//// Initial state. Evolved by actions below.

export const empty = {
  formDocId: '',
  activeDocId: '',
  requestedDocId: '',
  selected: null,
  hm: null
}


//// Action functions. Evolve loop state and may also re-dispatch subsequent actions.

// Starts IO subsystems and populates associated state.
export function init(state) {
  const hm = new Hypermerge({path: RAM, port: 0})
  hm.once('ready', () => {
    hm.joinSwarm()
    hm.on('document:ready', (docId, doc) => {
      Loop.dispatch(documentReady, { docId, doc })
    })
    hm.on('document:updated', (docId, doc) => {
      Loop.dispatch(documentUpdated, { docId, doc })
    })
    hm.create()
  })
  return Object.assign({}, state, { hm })
}

// Process the image at the given path, upgrading the card at id to an image
// card if id is given, otherwise creating a new image card at (x,y).
export function processImage(state, { path, id, x, y }) {
  Jimp.read(path, (err, img) => {
    if (err) {
      console.warn('Error loading image?', err)
      return
    }
    const width = img.bitmap.width
    const height = img.bitmap.height
    const [scaledWidth, scaledHeight] = scaleImage(width, height)
    if (id) {
      Loop.dispatch(cardInlinedImage, { id, path, width: scaledWidth, height: scaledHeight })
    } else {
      Loop.dispatch(cardCreatedImage, { path, x, y, width: scaledWidth, height: scaledHeight, selected: true })
    }
  })

  return state
}

function cardInlinedImage(state, { id, path, width, height }) {
  const newBoard = state.hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.type = 'image'
    card.path = path
    card.width = width
    card.height = height
    delete card.text
  })
  return Object.assign({}, state, {board: newBoard})
}

// Given the current text for a card indexed by id, sees if it contains only a
// local file path for a file type by supported by the app. In this case,
// converts the card from a text card to image card.
function maybeInlineFile(state, { id, text }) {
  const filePatMatch = filePat.exec(text)
  if (!filePatMatch) {
    return state
  }
  const path = filePatMatch[1]
  const extension = filePatMatch[2]
  Fs.stat(path, (err, stat) => {
    if (err || !stat.isFile()) {
      return
    }
    return processImage({ id, path })
  })
}

// Creates a new card and updates the current board to reflect.
function cardCreated(state, { x, y, width, height, selected, type, typeAttrs }) {
  const id = uuid()

  const newBoard = state.hm.change(state.board, (b) => {
    const snapX = snapToGrid(x)
    const snapY = snapToGrid(y)
    const newCard = Object.assign({
      id: id,
      type: type,
      x: snapX,
      y: snapY,
      width: width || CARD_DEFAULT_WIDTH,
      height: height || CARD_DEFAULT_HEIGHT,
      slackWidth: 0,
      slackHeight: 0,
      resizing: false,
      moving: false,
    }, typeAttrs)

    b.cards[id] = newCard
  })

  const newSelected = selected ? id : state.selected

  return Object.assign({}, state, {board: newBoard, selected: newSelected})
}

function populateDemoBoard(state) {
  if (state.board.cards) {
    throw new Error('Should only be called on an empty board')
  }

  const newBoard = state.hm.change(state.board, (b) => {
    b.cards = {}
  })
  state = Object.assign({}, state, { board: newBoard })
  state = cardCreatedText(state,  { x: 1350, y: 100, text: WELCOME_TEXT})
  state = cardCreatedText(state,  { x: 1350, y: 250, text: USAGE_TEXT })
  state = cardCreatedText(state,  { x: 1350, y: 750, text: EXAMPLE_TEXT })
  state = cardCreatedImage(state, { x: 1800, y: 150, path: '../img/carpenters-workshop.jpg', width: 500, height: 300 })
  state = cardCreatedImage(state, { x: 1750, y: 500, path: '../img/kay.jpg', width: (445/1.5), height: (385/1.5) })
  return state
}

export function cardCreatedText(state, { x, y, selected, text }) {
  return cardCreated(state, { x, y, selected, type: 'text', typeAttrs: { text: text } })
}

export function cardCreatedImage(state, { x, y, selected, path, width, height }) {
  return cardCreated(state, { x, y, selected, width, height, type: 'image', typeAttrs: { path: path }})
}

export function cardTextChanged(state, { id, text }) {
  const newBoard = state.hm.change(state.board, (b) => {
    b.cards[id].text = text
  })
  state = Object.assign({}, state, {board: newBoard})
  return maybeInlineFile(state, { id, text })
}

export function cardTextResized(state, { id, height }) {
  const newBoard = state.hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.height = height
  })
  return Object.assign({}, state, {board: newBoard})
}

export function cardMoved(state, { id, x, y }) {
  const newBoard = state.hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.x = x
    card.y = y
  })
  return Object.assign({}, state, {board: newBoard})
}

export function cardResized(state, {id, width, height }) {
  const newBoard = state.hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.width = width
    card.height = height
  })
  return Object.assign({}, state, {board: newBoard})
}

export function cardSelected(state, { id }) {
  return Object.assign({}, state, {selected: id})
}

export function cardUniquelySelected(state, { id }) {
  return cardSelected(state, { id })
}

export function clearSelections(state) {
  return Object.assign({}, state, {selected: null})
}

export function cardDeleted(state, { id }) {
  const newBoard = state.hm.change(state.board, (b) => {
    delete b.cards[id]
  })
  return Object.assign({}, state, {board: newBoard})
}

export function boardBackspaced(state) {
  for (let id in state.board.cards) {
    const card = state.board.cards[id]
    if ((id === state.selected) && (card.type !== 'text')) {
      return cardDeleted(state, { id: card.id })
    }
  }
}

export function documentReady(state, { docId, doc }) {
  // Case where app is loaded default empty doc.
  if (state.requestedDocId === '') {
    state = Object.assign({}, state, {
      activeDocId: docId,
      formDocId: docId,
      requestedDocId: docId,
      board: doc
    })
    return populateDemoBoard(state)
  // Case where an existing doc was opened and is still requested.
  } else if (state.requestedDocId === docId) {
    return Object.assign({}, state, {
      activeDocId: docId,
      board: doc
    })
  }
  // Case where an existing doc was opened but is no longer requested.
  return state
}

export function documentUpdated(state, { docId, doc }) {
  if (state.activeDocId !== docId) {
    return state
  }
  return Object.assign({}, state, {board: doc})
}

export function hashFormChanged(state, { docId }) {
  return Object.assign({}, state, {formDocId: docId})
}

export function  hashFormSubmitted(state) {
  state.hm.open(state.formDocId)
  return Object.assign({}, state, {requestedDocId: state.formDocId})
}
