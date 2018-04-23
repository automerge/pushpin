import uuid from 'uuid/v4'
import Fs from 'fs'
import Path from 'path'
import Jimp from 'jimp'
import { PDFImage } from 'pdf-image'

import { INITIALIZE, CARD_CREATED_TEXT, CARD_CREATED_IMAGE, CARD_CREATED_PDF, CARD_TEXT_CHANGED, CARD_TEXT_RESIZED, CARD_INLINED_IMAGE, CARD_INLINED_PDF, CARD_DRAG_STARTED, CARD_DRAG_MOVED, CARD_DRAG_STOPPED, CARD_SELECTED, CARD_UNIQUELY_SELECTED, CLEAR_SELECTIONS, CARD_DELETED, DOCUMENT_READY, DOCUMENT_UPDATED } from './action-types'

//// Contants

const BOARD_WIDTH = 3600
const BOARD_HEIGHT = 1800
const GRID_SIZE = 5
const CARD_DEFAULT_WIDTH = 300
const CARD_DEFAULT_HEIGHT = 100
const CARD_MIN_WIDTH = 100
const CARD_MIN_HEIGHT = 60
const RESIZE_HANDLE_SIZE = 21

const WELCOME_TEXT =
`## Welcome

This is our board demo!`

const USAGE_TEXT =
`### Usage

* Double-click to create a new text card.
* Right-click to create a new text, image, or PDF card.
* Click on a card to edit its text.
* Write Markdown in cards for formatting.
* Click and drag anywhere on a card to move it around.
* Click and drag on the bottom right corner of a card to resize it.
* Paste an absolute file name to an image or pdf as the only text in a card + hit enter, to load that file.
* Use arrow keys to scroll around the board.
* Press space + move the mouse to scroll around the board.`

const EXAMPLE_TEXT =
`### Example data

We've made some initial cards for you to play with. Have fun!`


//// Helper functions - may be called within action functions or from UI code.

// Pick a resonable initial display scale for an image of given dimensions.
function scaleImage(width, height) {
  const scaledWidth = CARD_DEFAULT_WIDTH
  const scaledHeight = height * (scaledWidth / width)
  return [scaledWidth, scaledHeight]
}

// Need to convert using these options to get good quality PDF previews.
const pdfConvertOptions = { convertOptions: { '-quality': '100', '-density': '218'} }

// Process the PDF at the given path, upgrading the card at id to a PDF
// card if id is given, otherwise creating a new PDF card at (x,y).
function processPDF(dispatch, path, id, x, y) {
  const pdfImage = new PDFImage(path, pdfConvertOptions)
  pdfImage.convertPage(0)
    .catch(err => {
      console.log('Error converting PDF to PNG?', err)
      return
    })
    .then(pngPath => {
      Jimp.read(pngPath, (err, img) => {
        if (err) {
          console.log('Error loading converted image?', err)
          return
        }
        const width = img.bitmap.width
        const height = img.bitmap.height
        const [scaledWidth, scaledHeight] = scaleImage(width, height)
        if (id) {
          dispatch({type: CARD_INLINED_PDF, id: id, path: pngPath, width: scaledWidth, height: scaledHeight})
        } else {
          dispatch({type: CARD_CREATED_PDF, path: pngPath, width: scaledWidth, height: scaledHeight, x: x, y: y})
        }
      })
    })
}

// Process the image at the given path, upgrading the card at id to an image
// card if id is given, otherwise creating a new image card at (x,y).
function processImage(dispatch, path, id, x, y) {
  Jimp.read(path, (err, img) => {
    if (err) {
      console.log('Error loading image?', err)
      return
    }
    const width = img.bitmap.width
    const height = img.bitmap.height
    const [scaledWidth, scaledHeight] = scaleImage(width, height)
    if (id) {
      dispatch({type: CARD_INLINED_IMAGE, id: id, path: path, width: scaledWidth, height: scaledHeight})
    } else {
      dispatch({type: CARD_CREATED_IMAGE, path: path, width: scaledWidth, height: scaledHeight, x: x, y: y})
    }
  })
}


// Recognizes absolute local file paths to supported file types.
const filePat = /^\s*(\/\S+\.(jpg|jpeg|png|gif|pdf))\n\s*$/

// Given the current text for a card indexed by id, sees if it contains only a
// local file path for a file type by supported by the app. In this case,
// converts the card from a text card to image or pdf card as appropriate.
function maybeInlineFile(dispatch, id, text) {
  const filePatMatch = filePat.exec(text)
  if (!filePatMatch) {
    return
  }
  const path = filePatMatch[1]
  const extension = filePatMatch[2]
  Fs.stat(path, (err, stat) => {
    if (err || !stat.isFile()) {
      return
    }
    const processFn = (extension === 'pdf') ? processPDF : processImage
    processFn(dispatch, path, id)
  })
}

// Snap given num to nearest multiple of our grid size.
function snapToGrid(num) {
  var resto = num % GRID_SIZE
  if (resto <= (GRID_SIZE / 2)) {
    return num - resto
  } else {
    return num + GRID_SIZE - resto
  }
}

function cardCreated(hm, state, { x, y, width, height, selected, type, typeAttrs }) {
  const newBoard = hm.change(state.board, (b) => {
    for (let id in b.cards) {
      const c = b.cards[id]
      if (c.selected) {
        c.selected = false
      }
    }

    const id = uuid()
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
      selected: selected
    }, typeAttrs)

    b.cards[id] = newCard
  })

  return Object.assign({}, state, {board: newBoard})
}

//// Initial state. Evolved by actions below.

const RootState = { }

//// Action functions. Functions match 1:1 with reducer switch further below.

function initialize(hm, state) {
  let board = hm.create()

  board = hm.change(board, (b) => {
    b.cards = {}
  })

  state = Object.assign({}, state, { board: board })

  state = cardCreatedText(hm, state,  { x: 1300, y: 300, selected: false, text: WELCOME_TEXT})

  state = cardCreatedText(hm, state,  { x: 1300, y: 450, selected: false, text: USAGE_TEXT })

  state = cardCreatedText(hm, state,  { x: 1300, y: 950, selected: false, text: EXAMPLE_TEXT })

  state = cardCreatedImage(hm, state, { x: 1750, y: 350, selected: false, path: '../img/carpenters-workshop.jpg', width: 500, height: 300 })

  state = cardCreatedImage(hm, state, { x: 1700, y: 700, selected: false, path: '../img/kay.jpg', width: (445/1.5), height: (385/1.5) })

  return state
}

function cardCreatedText(hm, state, { x, y, selected, text }) {
  return cardCreated(hm, state, { x, y, selected, type: 'text', typeAttrs: { text: text } })
}

function cardCreatedImage(hm, state, { x, y, selected, path, width, height }) {
  return cardCreated(hm, state, { x, y, selected, width, height, type: 'image', typeAttrs: { path: path }})
}

function cardCreatedPDF(hm, state, { x, y, selected, path, width, height}) {
  return cardCreated(hm, state, { x, y, selected, width, height, type: 'pdf', typeAttrs: { path: path }})
}

function cardTextChanged(hm, state, { id, text }) {
  const newBoard = hm.change(state.board, (b) => {
    b.cards[id].text = text
  })
  return Object.assign({}, state, {board: newBoard})
}

function cardTextResized(hm, state, { id, height }) {
  const card = state.board.cards[id]
  if (card.height >= height) {
    return state
  }
  const newBoard = hm.change(state.board, (b) => {
    b.cards[id].height = height
  })
  return Object.assign({}, state, {board: newBoard})
}

function cardInlinedImage(hm, state, { id, path, width, height }) {
  const newBoard = hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.type = 'image'
    card.path = path
    card.width = width
    card.height = height
    delete card.text
  })
  return Object.assign({}, state, {board: newBoard})
}

function cardInlinedPDF(hm, state, { id, path, width, height }) {
  const newBoard = hm.change(state.board, (b) => {
    const card = b.cards[id]
    card.type = 'pdf'
    card.path = path
    card.width = width
    card.height = height
    delete card.text
  })
  return Object.assign({}, state, {board: newBoard})
}

function cardDragStarted(hm, state, { id, x, y }) {
  const newBoard = hm.change(state.board, (b) => {
    const card = b.cards[id]
    const resizing = ((x >= (card.x + card.width - RESIZE_HANDLE_SIZE)) &&
                      (x <= (card.x + card.width)) &&
                      (y >= (card.y + card.height - RESIZE_HANDLE_SIZE)) &&
                      (y <= (card.y + card.height)))
    const moving = !resizing
    card.resizing = resizing
    card.moving = moving
    card.totalDrag = 0
  })
  return Object.assign({}, state, {board: newBoard})
}

function cardDragMoved(hm, state, { id, deltaX, deltaY }) {
  const newBoard = hm.change(state.board, (b) => {
    const card = b.cards[id]

    if (!card.resizing && !card.moving) {
      throw new Error(`Did not expect drag without resize or move`)
    }
    if (card.resizing && card.moving) {
      throw new Error(`Did not expect drag with both resize and move`)
    }

    const newTotalDrag = card.totalDrag + Math.abs(deltaX) + Math.abs(deltaY)

    if (card.resizing) {
      // First guess at change in dimensions given mouse movements.
      let preClampWidth = card.width + deltaX
      let preClampHeight = card.height + deltaY

      // Maintain aspect ratio on image cards.
      if (card.type !== 'text') {
        const ratio = card.width / card.height
        preClampHeight = preClampWidth / ratio
        preClampWidth = preClampHeight * ratio
      }

      // Add slack to the values used to calculate bound position. This will
      // ensure that if we start removing slack, the element won't react to
      // it right away until it's been completely removed.
      let newWidth = preClampWidth + card.slackWidth
      let newHeight = preClampHeight + card.slackHeight

      // Clamp to ensure card doesn't resize beyond the board or min dimensions.
      newWidth = Math.max(CARD_MIN_WIDTH, newWidth)
      newWidth = Math.min(BOARD_WIDTH - card.x, newWidth)
      newHeight = Math.max(CARD_MIN_HEIGHT, newHeight)
      newHeight = Math.min(BOARD_HEIGHT - card.y, newHeight)

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      const newSlackWidth = card.slackWidth + preClampWidth - newWidth
      const newSlackHeight = card.slackHeight + preClampHeight - newHeight

      card.width = newWidth
      card.height = newHeight
      card.slackWidth = newSlackWidth
      card.slackHeight = newSlackHeight
      card.totalDrag = newTotalDrag
    }

    if (card.moving) {
      // First guess at change in location given mouse movements.
      let preClampX = card.x + deltaX
      let preClampY = card.y + deltaY

      // Add slack to the values used to calculate bound position. This will
      // ensure that if we start removing slack, the element won't react to
      // it right away until it's been completely removed.
      let newX = preClampX + card.slackWidth
      let newY = preClampY + card.slackHeight

      // Clamp to ensure card doesn't move beyond the board.
      newX = Math.max(newX, 0)
      newX = Math.min(newX, BOARD_WIDTH - card.width)
      newY = Math.max(newY, 0)
      newY = Math.min(newY, BOARD_HEIGHT - card.height)

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      const newSlackWidth = card.slackWidth + preClampX - newX
      const newSlackHeight = card.slackHeight + preClampY - newY

      card.x = newX
      card.y = newY
      card.slackWidth = newSlackWidth
      card.slackHeight = newSlackHeight
      card.totalDrag = newTotalDrag
    }
  })

  return Object.assign({}, state, {board: newBoard})
}

function cardDragStopped(hm, state, { id }) {
  const newBoard = hm.change(state.board, (b) => {
    const card = b.cards[id]
    const snapX = snapToGrid(card.x)
    const snapY = snapToGrid(card.y)
    const snapWidth = snapToGrid(card.width)
    const snapHeight = snapToGrid(card.height)
    const selectedBefore = card.selected
    const minDragSelection = card.totalDrag < GRID_SIZE/2
    // Clear selections if we're effectively just clicking on this card.
    if (minDragSelection) {
      for (let id in b.cards) {
        const c = b.cards[id]
        if (c.selected) {
          c.selected = false
        }
      }
    }
    card.x = snapX
    card.y = snapY
    card.width = snapWidth
    card.height = snapHeight
    card.slackWidth = 0
    card.slackHeight = 0
    card.resizing = false
    card.moving = false
    card.selected = selectedBefore || minDragSelection
    delete card.totalDrag
  })

  return Object.assign({}, state, {board: newBoard})
}

function cardSelected(hm, state, { id }) {
  const newBoard = hm.change(state.board, (b) => {
    b.cards[id].selected = true
  })
  return Object.assign({}, state, {board: newBoard})
}

function cardUniquelySelected(hm, state, { id }) {
  const newBoard = hm.change(state.board, (b) => {
    for (let id in b.cards) {
      const c = b.cards[id]
      if (c.selected) {
        c.selected = false
      }
    }
    b.cards[id].selected = true
  })
 return Object.assign({}, state, {board: newBoard})
}

function clearSelections(hm, state) {
  const newBoard = hm.change(state.board, (b) => {
    for (let id in b.cards) {
      const c = b.cards[id]
      if (c.selected) {
        c.selected = false
      }
    }
  })
  return Object.assign({}, state, {board: newBoard})
}

function cardDeleted(hm, state, { id }) {
  const newBoard = hm.change(state.board, (b) => {
    delete b.cards[id]
  })
  return Object.assign({}, state, {board: newBoard})
}

//// Reducer switch. Cases match 1:1 with action functions above.

function Reducer(hm) {
  return (state, action) => {
     console.log(action)

    switch (action.type) {
      case '@@redux/INIT':
        return state;

      case DOCUMENT_READY:
        return state

      case DOCUMENT_UPDATED:
        return state

      case INITIALIZE:
        return initialize(hm, state);

      case CARD_CREATED_TEXT:
        return cardCreatedText(hm, state, action)

      case CARD_CREATED_IMAGE:
        return cardCreatedImage(hm, state, action)

      case CARD_CREATED_PDF:
        return cardCreatedPDF(hm, state, action)

      case CARD_TEXT_CHANGED:
        return cardTextChanged(hm, state, action)

      case CARD_TEXT_RESIZED:
        return cardTextResized(hm, state, action)

      case CARD_INLINED_IMAGE:
        return cardInlinedImage(hm, state, action)

      case CARD_INLINED_PDF:
        return cardInlinedPDF(hm, state, action)

      case CARD_DRAG_STARTED:
        return cardDragStarted(hm, state, action)

      case CARD_DRAG_MOVED:
        return cardDragMoved(hm, state, action)

      case CARD_DRAG_STOPPED:
        return cardDragStopped(hm, state, action)

      case CARD_SELECTED:
        return cardSelected(hm, state, action)

      case CARD_UNIQUELY_SELECTED:
        return cardUniquelySelected(hm, state, action)

      case CLEAR_SELECTIONS:
        return clearSelections(hm, state)

      case CARD_DELETED:
        return cardDeleted(hm, state, action)

      default:
        throw new Error(`Unkonwn action: ${action.type}`);
    }
  }
}

export { RootState, Reducer, maybeInlineFile, processImage, processPDF, BOARD_WIDTH, BOARD_HEIGHT };
