import uuid from 'uuid/v4'
import Fs from 'fs'
import Path from 'path'
import Jimp from 'jimp'
import Hypermerge from 'hypermerge'
import RAM from 'random-access-memory'
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
export const CARD_DEFAULT_WIDTH = 336
export const CARD_DEFAULT_HEIGHT = 96
export const CARD_MIN_WIDTH = 96
export const CARD_MIN_HEIGHT = 48
export const RESIZE_HANDLE_SIZE = 21

const RECENT_DOCS_MAX = 5

const USER = process.env.NAME || 'userA'
const USER_PATH = Path.join('.', 'data', USER)
const HYPERFILE_DATA_PATH = Path.join(USER_PATH, 'hyperfile')
const HYPERFILE_CACHE_PATH = Path.join(USER_PATH, 'hyperfile-cache')
const HYPERMERGE_PATH = Path.join(USER_PATH, 'hypermerge')

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
EventEmitter.prototype._maxListeners = 50

// ## Pure helper functions.

// Pick a resonable initial display scale for an image of given dimensions.
function scaleImage(width, height) {
  const scaledWidth = CARD_DEFAULT_WIDTH
  const scaledHeight = height * (scaledWidth / width)
  return [scaledWidth, scaledHeight]
}

// Snap given num to nearest multiple of our grid size.
export function snapToGrid(num) {
  const resto = num % GRID_SIZE
  if (resto <= (GRID_SIZE / 2)) {
    return num - resto
  }
  return num + GRID_SIZE - resto
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

// Recognizes absolute local file paths to supported file types.
const filePat = /^\s*(\/\S+\.(jpg|jpeg|png|gif))\n\s*$/

// Given the current text for a card indexed by id, sees if it contains only a
// local file path for a file type by supported by the app. In this case,
// converts the card from a text card to image card.
export function maybeInlineFile(id, text) {
  const filePatMatch = filePat.exec(text)
  if (!filePatMatch) {
    return
  }
  const path = filePatMatch[1]
  // const extension = filePatMatch[2]; // unused but kept to remind us it's here
  Fs.stat(path, (err, stat) => {
    if (err || !stat.isFile()) {
      return
    }
    Loop.dispatch(processImage, { path, id })
  })
}


// ## Initial state. Evolved by actions below.

export const empty = {
  formDocId: '',
  activeDocId: '',
  requestedDocId: '',
  selected: null,
  hm: null
}


// ## Action functions. Evolve loop state and may also re-dispatch subsequent actions.

// Starts IO subsystems and populates associated state.
export function init(state) {
  const hm = new Hypermerge({ path: HYPERMERGE_PATH, port: 0 })
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

function addRecentDoc(state, { docId }) {
  let recentDocs = getRecentDocs()
  const recentDocIndex = recentDocs.findIndex(d => d === docId)

  if(Number.isInteger(recentDocIndex))
    recentDocs = [ docId, ...recentDocs.slice(0, recentDocIndex), ...recentDocs.slice(recentDocIndex + 1) ]
  else {
    recentDocs = [ docId, ...recentDocs ]
    recentDocs = recentDocs.slice(0, RECENT_DOCS_MAX)
  }

  Fs.writeFileSync(recentDocsPath(), JSON.stringify(recentDocs))

  return state
}

function recentDocsPath() {
  return Path.join(USER_PATH, "recent-docs.json")
}

export function getRecentDocs() {
  if(Fs.existsSync(recentDocsPath()))
    return JSON.parse(Fs.readFileSync(recentDocsPath()))
  else
    return []
}

// Process the image at the given path, upgrading the card at id to an image
// card if id is given, otherwise creating a new image card at (x,y).
// This is structured an action for consistency. It passes through state
// unchanged. State will be updated in callbacks by redispatching to
// another action (cardCreatedImage). We could add state to indicate in-
// progress processing here later if we wanted to.
export function processImage(state, { path, x, y }) {
  Jimp.read(path, (err, img) => {
    if (err) {
      log('Error loading image?', err)
      return
    }
    const width = img.bitmap.width
    const height = img.bitmap.height
    const [scaledWidth, scaledHeight] = scaleImage(width, height)
    const imageId = uuid()

    Hyperfile.write(HYPERFILE_DATA_PATH, imageId, path, (error, key) => {
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

export function cardCreated(state, { x, y, width, height, selected, type, typeAttrs }) {
  const id = uuid()

  const newBoard = state.hm.change(state.board, (b) => {
    const snapX = snapToGrid(x)
    const snapY = snapToGrid(y)
    const newCard = Object.assign({
      id,
      type,
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

  return Object.assign({}, state, { board: newBoard, selected: newSelected })
}

function populateDemoBoard(state) {
  if (state.board.cards) {
    throw new Error('Should only be called on an empty board')
  }

  const newBoard = state.hm.change(state.board, (b) => {
    b.cards = {}
  })
  let newState = Object.assign({}, state, { board: newBoard })
  newState = cardCreatedText(newState, { x: 1350, y: 100, text: WELCOME_TEXT })
  newState = cardCreatedText(newState, { x: 1350, y: 250, text: USAGE_TEXT })
  newState = cardCreatedText(newState, { x: 1350, y: 750, text: EXAMPLE_TEXT })

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

export function cardTextChanged(state, { id, text }) {
  const newBoard = state.hm.change(state.board, (b) => {
    b.cards[id].text = text
  })
  return Object.assign({}, state, { board: newBoard })
}

export function cardTextResized(state, { id, height }) {
  const newBoard = state.hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.height = height
  })
  return Object.assign({}, state, { board: newBoard })
}

export function cardInlinedImage(state, { id, path, width, height }) {
  const newBoard = state.hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.type = 'image'
    card.path = path
    card.width = width
    card.height = height
    delete card.text
  })
  return Object.assign({}, state, { board: newBoard })
}

export function cardMoved(state, { id, x, y }) {
  const newBoard = state.hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.x = x
    card.y = y
  })
  return Object.assign({}, state, { board: newBoard })
}

export function cardResized(state, { id, width, height }) {
  const newBoard = state.hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.width = width
    card.height = height
  })
  return Object.assign({}, state, { board: newBoard })
}

export function cardSelected(state, { id }) {
  return Object.assign({}, state, { selected: id })
}

export function cardUniquelySelected(state, { id }) {
  return cardSelected(state, { id })
}

export function clearSelections(state) {
  return Object.assign({}, state, { selected: null })
}

export function cardDeleted(state, { id }) {
  const newBoard = state.hm.change(state.board, (b) => {
    delete b.cards[id]
  })
  return Object.assign({}, state, { board: newBoard })
}

export function boardBackspaced(state) {
  for (const id in state.board.cards) {
    const card = state.board.cards[id]
    if ((id === state.selected) && (card.type !== 'text')) {
      return cardDeleted(state, { id: card.id })
    }
  }
  return state
}

export function documentReady(state, { docId, doc }) {
  // Case where app is loaded default empty doc.
  if (state.requestedDocId === '' || !state.hm.has(state.requestedDocId)) {
    Loop.dispatch(addRecentDoc, { docId })

    return populateDemoBoard(Object.assign({}, state, {
      activeDocId: docId,
      formDocId: docId,
      requestedDocId: docId,
      board: doc,
    }))
  // Case where an existing doc was opened and is still requested.
  } else if (state.requestedDocId === docId) {
    Loop.dispatch(addRecentDoc, { docId })

    return Object.assign({}, state, {
      activeDocId: docId,
      formDocId: docId,
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
  return Object.assign({}, state, { board: doc })
}

export function formChanged(state, { docId }) {
  return Object.assign({}, state, { formDocId: docId })
}

export function formSubmitted(state) {
  state.hm.open(state.formDocId)
  return Object.assign({}, state, { requestedDocId: state.formDocId })
}
