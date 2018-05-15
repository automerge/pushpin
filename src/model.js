import uuid from 'uuid/v4'
import Fs from 'fs'
import Path from 'path'
import Jimp from 'jimp'
import Automerge from 'automerge'
import Hypermerge from 'hypermerge'
import Debug from 'debug'
import mkdirp from 'mkdirp'
import { EventEmitter } from 'events'

import Loop from './loop'
import * as Hyperfile from './hyperfile'

const log = Debug('pushpin:model')


// ## Constants

export const BOARD_WIDTH = 3600
export const BOARD_HEIGHT = 1800
export const GRID_SIZE = 24
export const CARD_DEFAULT_WIDTH = 337
export const CARD_DEFAULT_HEIGHT = 97
export const CARD_MIN_WIDTH = 97
export const CARD_MIN_HEIGHT = 49
export const RESIZE_HANDLE_SIZE = 21

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

export const CARD_COLORS = {
  SNOW: '#ffffff',
  BEIGE: '#cbc5b5',
  SKY: '#8edce6',
  VIOLET: '#a98fdc',
  PINK: '#ff87a1',
  HERB: '#b5e6a1',
  PEACH: '#ff7868',
  CLOUD: '#e5ebf3',
}

const RECENT_DOCS_MAX = 5
const USER = process.env.NAME || 'userA'
const USER_PATH = Path.join('.', 'data', USER)
const HYPERFILE_DATA_PATH = Path.join(USER_PATH, 'hyperfile')
const HYPERFILE_CACHE_PATH = Path.join(USER_PATH, 'hyperfile-cache')
const HYPERMERGE_PATH = Path.join(USER_PATH, 'hypermerge')
const RECENT_DOCS_PATH = Path.join(USER_PATH, 'recent-docs.json')


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


// ## Imperative top-levels.

mkdirp.sync(HYPERFILE_DATA_PATH)
mkdirp.sync(HYPERFILE_CACHE_PATH)

// It's normal for a document with a lot of participants to have a lot of
// connections, so increase the limit to avoid spurious warnings about
// emitter leaks.
EventEmitter.defaultMaxListeners = 100


// ## Pure helper functions.

// Pick a resonable initial display scale for an image of given dimensions.
function scaleImage(width, height) {
  const scaledWidth = CARD_DEFAULT_WIDTH
  const scaledHeight = height * (scaledWidth / width)
  return [scaledWidth, scaledHeight]
}

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

// ## IO helper functions.

export function fetchImage({ imageId, imageExt, key }, callback) {
  Hyperfile.fetch(HYPERFILE_DATA_PATH, imageId, key, (error, blob) => {
    if (error) {
      callback(error)
      return
    }

    const imagePath = Path.join(HYPERFILE_CACHE_PATH, imageId + imageExt)
    Fs.writeFile(imagePath, blob, (error) => {
      if (error) {
        callback(error)
        return
      }

      callback(null, imagePath)
    })
  })
}

// Synchronously read from disk and return the list of recent board doc ids.
function readRecentDocs() {
  if (Fs.existsSync(RECENT_DOCS_PATH)) {
    return JSON.parse(Fs.readFileSync(RECENT_DOCS_PATH))
  }
  return []
}

// Synchronously write to disk the list of recent board doc ids.
function writeRecentDocs(recentDocs) {
  Fs.writeFileSync(RECENT_DOCS_PATH, JSON.stringify(recentDocs))
}

// Helper for state.hm.change so that it's easier to insert debugging.
function changeBoard(state, changeFn) {
  return state.hm.change(state.board, changeFn)
}


// ## Initial state. Evolved by actions below.

export const empty = {
  formDocId: '',
  activeDocId: '',
  requestedDocId: '',
  selected: [],
  board: null,
  hm: null,
}


// ## Action functions. Evolve loop state and may also re-dispatch subsequent actions.

// Starts IO subsystems and populates associated state.
export function init(state) {
  const hm = new Hypermerge({ path: HYPERMERGE_PATH, port: 0 })
  const recentDocs = readRecentDocs()
  const requestedDocId = recentDocs.length > 0 ? recentDocs[0] : state.requestedDocId

  hm.once('ready', () => {
    hm.joinSwarm()

    hm.on('document:ready', (docId, doc) => {
      Loop.dispatch(documentReady, { docId, doc })
    })

    hm.on('document:updated', (docId, doc) => {
      Loop.dispatch(documentUpdated, { docId, doc })
    })

    if (requestedDocId === '') {
      Loop.dispatch(newDocument)
    }
  })

  return { ...state, hm, requestedDocId }
}

function addRecentDoc(state, { docId }) {
  let recentDocs = readRecentDocs()
  const recentDocIndex = recentDocs.findIndex(d => d === docId)

  if (Number.isInteger(recentDocIndex)) {
    recentDocs = [docId,
      ...recentDocs.slice(0, recentDocIndex),
      ...recentDocs.slice(recentDocIndex + 1)]
  } else {
    recentDocs = [docId, ...recentDocs]
    recentDocs = recentDocs.slice(0, RECENT_DOCS_MAX)
  }

  writeRecentDocs(recentDocs)

  return state
}

function recentDocsPath() {
  return Path.join(USER_PATH, 'recent-docs.json')
}

export function getRecentDocs() {
  if (Fs.existsSync(recentDocsPath())) {
    return JSON.parse(Fs.readFileSync(recentDocsPath()))
  }
  return []
}

// Process the image at the given path or in the given buffer, creating a new
// image card at (x, y).
// This is structured an action for consistency. It passes through state
// unchanged. State will be updated in callbacks by redispatching to
// another action (cardCreatedImage). We could add state to indicate in-
// progress processing here later if we wanted to.
export function processImage(state, { path, buffer, x, y }) {
  const imageSource = buffer || path
  Jimp.read(imageSource, (err, img) => {
    if (err) {
      log('Error loading image?', err)
      return
    }
    const { width, height } = img.bitmap
    const [scaledWidth, scaledHeight] = scaleImage(width, height)
    const imageId = uuid()
    const writeFn = buffer ? Hyperfile.writeBuffer : Hyperfile.writePath
    writeFn(HYPERFILE_DATA_PATH, imageId, imageSource, (error, key) => {
      if (error) {
        log(error)
      }

      Loop.dispatch(cardCreatedImage, {
        width: scaledWidth,
        height: scaledHeight,
        x,
        y,
        selected: true,
        hyperfile: {
          key: key.toString('base64'),
          imageId,
          imageExt: Path.extname(path),
        },
      })
    })
  })

  return state
}

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

function populateDemoBoard(state) {
  if (state.board.cards) {
    throw new Error('Should only be called on an empty board')
  }

  const newBoard = changeBoard(state, (b) => {
    b.cards = {}
  })
  let newState = { ...state, board: newBoard }
  newState = cardCreatedText(newState, { x: 1350, y: 100, text: WELCOME_TEXT })
  newState = cardCreatedText(newState, { x: 1350, y: 250, text: USAGE_TEXT })
  newState = cardCreatedText(newState, { x: 1350, y: 750, text: EXAMPLE_TEXT })

  newState = setTitle(newState, { title: 'Example Board' })
  newState = setBackgroundColor(newState, { backgroundColor: BOARD_COLORS.SKY })

  // These will be handled async as they require their own IO.
  Loop.dispatch(processImage, { x: 1750, y: 500, path: KAY_PATH })
  Loop.dispatch(processImage, { x: 1800, y: 150, path: WORKSHOP_PATH })

  return newState
}

export function cardCreatedText(state, { x, y, selected, text }) {
  return cardCreated(state, { x, y, selected, type: 'text', typeAttrs: { text } })
}

export function cardCreatedImage(state, { x, y, selected, width, height, hyperfile }) {
  return cardCreated(state, { x, y, selected, width, height, type: 'image', typeAttrs: { hyperfile } })
}

export function cardTextChanged(state, { id, at, removedLength, addedText }) {
  const newBoard = changeBoard(state, (b) => {
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
  const newBoard = changeBoard(state, (b) => {
    const card = b.cards[id]
    // Ensure  text doesn't stick out of the bottom of card.
    card.height = snapMeasureOutwardToGrid(height)
  })
  return { ...state, board: newBoard }
}

export function cardInlinedImage(state, { id, path, width, height }) {
  const newBoard = changeBoard(state, (b) => {
    const card = b.cards[id]
    card.type = 'image'
    card.path = path
    card.width = width
    card.height = height
    delete card.text
  })
  return { ...state, board: newBoard }
}

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

export function cardDeleted(state, { id }) {
  const newBoard = changeBoard(state, (b) => {
    delete b.cards[id]
  })
  return { ...state, board: newBoard }
}

export function boardBackspaced(state) {
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

export function newDocument(state) {
  const doc = state.hm.create()
  const docId = state.hm.getId(doc)

  return {
    ...state,
    formDocId: docId,
    requestedDocId: docId,
  }
}

export function documentReady(state, { docId, doc }) {
  // Case where an existing doc was opened but is no longer requested.
  if (state.requestedDocId !== docId) {
    return state
  }

  // Case where we've created or opened the requested doc.
  // It may be an unitialized board in which case we need to populate it.
  state = { ...state,
    activeDocId: docId,
    formDocId: docId,
    board: doc
  }
  if (!state.board.cards) {
    state = populateDemoBoard(state)
  }
  state = addRecentDoc(state, { docId })

  return state
}

export function documentUpdated(state, { docId, doc }) {
  if (state.activeDocId !== docId) {
    return state
  }
  return { ...state, board: doc }
}

export function formChanged(state, { docId }) {
  return { ...state, formDocId: docId }
}

export function formSubmitted(state) {
  // If we've already opened the hypermerge doc,
  // it will not fire a 'document:ready' event if we open it again
  // so we need to find the doc and manually trigger the action
  if (state.hm.has(state.formDocId)) {
    const doc = state.hm.find(state.formDocId)
    const docId = state.formDocId

    Loop.dispatch(documentReady, { doc, docId })
  } else {
    state.hm.open(state.formDocId)
  }

  return { ...state, requestedDocId: state.formDocId }
}
