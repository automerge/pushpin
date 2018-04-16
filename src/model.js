import { Map, List } from 'immutable'
import { EditorState } from 'draft-js'
import uuid from 'uuid/v4'
import Fs from 'fs'
import Path from 'path'
import Jimp from 'jimp'
import { PDFImage } from 'pdf-image'

import { INITIALIZE_IF_EMPTY, CARD_CREATED_TEXT, CARD_CREATED_IMAGE, CARD_CREATED_PDF, CARD_EDITOR_CHANGED, CARD_TEXT_RESIZED, CARD_INLINED_IMAGE, CARD_INLINED_PDF, CARD_DRAG_STOPPED, CARD_RESIZE_STOPPED, CARD_SELECTED, CLEAR_SELECTIONS } from './action-types'

//// Contants

const GRID_SIZE = 5
const CARD_DEFAULT_WIDTH = 250
const CARD_DEFAULT_HEIGHT = 100
const CARD_MIN_WIDTH = 100
const CARD_MIN_HEIGHT = 100


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

// Given the current editorState for a card indexed by id, sees if the text
// contains only a local file path for a file type by supported by the app. In
// this case, converts the card from a text card to image or pdf card as
// appropriate.
function maybeInlineFile(dispatch, id, editorState) {
  const plainText = editorState.getCurrentContent().getPlainText('\n')
  const filePatMatch = filePat.exec(plainText)
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


//// Initial state. Evolved by actions below.

const RootState = new Map({
  cards: new Map()
})


//// Action functions. Functions match 1:1 with reducer switch further below.

function initializeIfEmpty(state) {
  state = cardCreatedText(state,  { x: 50,  y: 50,  selected: false })
  state = cardCreatedText(state,  { x: 200, y: 400, selected: false })
  state = cardCreatedText(state,  { x: 400, y: 200, selected: false })
  state = cardCreatedImage(state, { x: 750, y: 100, selected: false, path: '../img/kay.jpg', width: (900/3), height: (750/3) })
  const id = uuid()
  return state
}

function cardCreatedText(state, { x, y, selected }) {
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
    selected: selected,
    editorState: EditorState.createEmpty()
  }))
  return state
}

function cardCreatedImage(state, { x, y, selected, path, width, height }) {
  const id = uuid()
  const snapX = snapToGrid(x)
  const snapY = snapToGrid(y)
  state = state.setIn(['cards', id], new Map({
    id: id,
    type: 'image',
    x: snapX,
    y: snapY,
    width: width,
    height: height,
    selected: selected,
    path: path
  }))
  return state
}

function cardCreatedPDF(state, { x, y, selected, path, width, height}) {
  const id = uuid()
  const snapX = snapToGrid(x)
  const snapY = snapToGrid(y)
  state = state.setIn(['cards', id], new Map({
    id: id,
    type: 'pdf',
    x: snapX,
    y: snapY,
    width: width,
    height: height,
    selected: selected,
    path: path
  }))
  return state
}

function cardEditorChanged(state, { id, editorState }) {
  return state.setIn(['cards', id, 'editorState'], editorState)
}

function cardTextResized(state, { id, height }) {
  const currentHeight = state.getIn(['cards', id, 'height'])
  if (currentHeight < height) {
    return state.setIn(['cards', id, 'height'], height)
  }
  return state
}

function cardInlinedImage(state, { id, path, width, height }) {
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('type', 'image')
      .set('path', path)
      .set('width', width)
      .set('height', height)
      .delete('editorState')
  })
}

function cardInlinedPDF(state, { id, path, width, height }) {
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('type', 'pdf')
      .set('path', path)
      .set('width', width)
      .set('height', height)
      .delete('editorState')
  })
}

function cardDragStopped(state, { id, x, y }) {
  const snapX = snapToGrid(x)
  const snapY = snapToGrid(y)
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('x', snapX)
      .set('y', snapY)
  })
}

function cardResizeStopped(state, { id, width, height }) {
  const snapWidth = snapToGrid(width)
  const snapHeight = snapToGrid(height)
  return state.updateIn(['cards', id], (card) => {
    return card
      .set('width', snapWidth)
      .set('height', snapHeight)
  })
}

function cardSelected(state, { id }) {
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


//// Reducer switch. Cases match 1:1 with action functions above.

function Reducer(state, action) {
  console.log(action)

  switch (action.type) {
    case INITIALIZE_IF_EMPTY:
      return initializeIfEmpty(state);

    case CARD_CREATED_TEXT:
      return cardCreatedText(state, action)

    case CARD_CREATED_IMAGE:
      return cardCreatedImage(state, action)

    case CARD_CREATED_PDF:
      return cardCreatedPDF(state, action)

    case CARD_EDITOR_CHANGED:
      return cardEditorChanged(state, action)

    case CARD_TEXT_RESIZED:
      return cardTextResized(state, action)

    case CARD_INLINED_IMAGE:
      return cardInlinedImage(state, action)

    case CARD_INLINED_PDF:
      return cardInlinedPDF(state, action)

    case CARD_DRAG_STOPPED:
      return cardDragStopped(state, action)

    case CARD_RESIZE_STOPPED:
      return cardResizeStopped(state, action)

    case CARD_SELECTED:
      return cardSelected(state, action)

    case CLEAR_SELECTIONS:
      return clearSelections(state)

    case '@@redux/INIT':
      return state;

    default:
      throw new Error(`Unkonwn action: ${action.type}`);
  }
}

export { RootState, Reducer, maybeInlineFile, processImage, processPDF };
