import uuid from 'uuid/v4';
import Fs from 'fs';
import Path from 'path';
import Jimp from 'jimp';
import Debug from 'debug';
import mkdirp from 'mkdirp';

import { INITIALIZE_IF_EMPTY, CARD_CREATED_TEXT, CARD_CREATED_IMAGE, CARD_TEXT_CHANGED, CARD_TEXT_RESIZED, CARD_INLINED_IMAGE, CARD_MOVED, CARD_RESIZED, CARD_SELECTED, CARD_UNIQUELY_SELECTED, CLEAR_SELECTIONS, CARD_DELETED, DOCUMENT_READY, DOCUMENT_UPDATED, FORM_CHANGED, FORM_SUBMITTED } from './action-types';
import * as Hyperfile from './hyperfile';

// // Contants

const BOARD_WIDTH = 3600;
const BOARD_HEIGHT = 1800;
const GRID_SIZE = 5;
const CARD_DEFAULT_WIDTH = 300;
const CARD_DEFAULT_HEIGHT = 100;
const CARD_MIN_WIDTH = 100;
const CARD_MIN_HEIGHT = 60;
const RESIZE_HANDLE_SIZE = 21;

const USER = process.env.NAME || 'userA';
const USER_PATH = Path.join('.', 'data', USER);
const HYPERFILE_DATA_PATH = Path.join(USER_PATH, 'hyperfile');
const HYPERFILE_CACHE_PATH = Path.join(USER_PATH, 'hyperfile-cache');

mkdirp.sync(HYPERFILE_DATA_PATH);
mkdirp.sync(HYPERFILE_CACHE_PATH);

const WELCOME_TEXT =
`## Welcome

This is our board demo!`;

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
* Press space + move the mouse to scroll around the board.`;

const EXAMPLE_TEXT =
`### Example data

We've made some initial cards for you to play with. Have fun!`;

const log = Debug('pushpin:model');

// // Helper functions - may be called within action functions or from UI code.

// Pick a resonable initial display scale for an image of given dimensions.
function scaleImage(width, height) {
  const scaledWidth = CARD_DEFAULT_WIDTH;
  const scaledHeight = height * (scaledWidth / width);
  return [scaledWidth, scaledHeight];
}

function copyFile(source, destination, callback) {
  Fs.readFile(source, (error, data) => {
    if (error) {
      callback(error);
      return;
    }

    Fs.writeFile(destination, data, (error) => {
      if (error) {
        callback(error);
        return;
      }

      callback();
    });
  });
}

function fetchImage({ imageId, imageExt, key }, callback) {
  Hyperfile.fetch(HYPERFILE_DATA_PATH, imageId, key, (error, blobPath) => {
    if (error) {
      callback(error);
      return;
    }

    const imagePath = Path.join(HYPERFILE_CACHE_PATH, imageId + imageExt);
    copyFile(blobPath, imagePath, error => callback(error, imagePath));
  });
}

// Process the image at the given path, upgrading the card at id to an image
// card if id is given, otherwise creating a new image card at (x,y).
function processImage(dispatch, path, x, y) {
  Jimp.read(path, (err, img) => {
    if (err) {
      console.warn('Error loading image?', err);
      return;
    }
    const width = img.bitmap.width;
    const height = img.bitmap.height;
    const [scaledWidth, scaledHeight] = scaleImage(width, height);
    const imageId = uuid();

    Hyperfile.write(HYPERFILE_DATA_PATH, imageId, path, (error, key) => {
      if (error) {
        log(error);
      }

      dispatch({
        type: CARD_CREATED_IMAGE,
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
      });
    });
  });
}


// Recognizes absolute local file paths to supported file types.
const filePat = /^\s*(\/\S+\.(jpg|jpeg|png|gif))\n\s*$/;

// Given the current text for a card indexed by id, sees if it contains only a
// local file path for a file type by supported by the app. In this case,
// converts the card from a text card to image card.
function maybeInlineFile(dispatch, id, text) {
  const filePatMatch = filePat.exec(text);
  if (!filePatMatch) {
    return;
  }
  const path = filePatMatch[1];
  // const extension = filePatMatch[2]; // unused but kept to remind us it's here
  Fs.stat(path, (err, stat) => {
    if (err || !stat.isFile()) {
      return;
    }
    processImage(dispatch, path, id);
  });
}

// Snap given num to nearest multiple of our grid size.
function snapToGrid(num) {
  const resto = num % GRID_SIZE;
  if (resto <= (GRID_SIZE / 2)) {
    return num - resto;
  }
  return num + GRID_SIZE - resto;
}

function cardCreated(hm, state, { x, y, width, height, selected, type, typeAttrs }) {
  const id = uuid();

  const newBoard = hm.change(state.board, (b) => {
    const snapX = snapToGrid(x);
    const snapY = snapToGrid(y);
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
    }, typeAttrs);

    b.cards[id] = newCard;
  });

  const newSelected = selected ? id : state.selected;

  return Object.assign({}, state, { board: newBoard, selected: newSelected });
}

// // Initial state. Evolved by actions below.

const RootState = {
  formDocId: '',
  activeDocId: '',
  requestedDocId: '',
  selected: null,
};

// // Action functions. Functions match 1:1 with reducer switch further below.

function initializeIfEmpty(hm, state) {
  if (state.board.cards) {
    return state;
  }

  const newBoard = hm.change(state.board, b => b.cards = {});

  let newState = Object.assign({}, state, { board: newBoard });
  newState = cardCreatedText(hm, newState, { x: 1350, y: 100, text: WELCOME_TEXT });
  newState = cardCreatedText(hm, newState, { x: 1350, y: 250, text: USAGE_TEXT });
  newState = cardCreatedText(hm, newState, { x: 1350, y: 750, text: EXAMPLE_TEXT });

  return newState;
}

function cardCreatedText(hm, state, { x, y, selected, text }) {
  return cardCreated(hm, state, { x, y, selected, type: 'text', typeAttrs: { text } });
}

function cardCreatedImage(hm, state, { x, y, selected, width, height, hyperfile }) {
  return cardCreated(hm, state, { x, y, selected, width, height, type: 'image', typeAttrs: { hyperfile } });
}

function cardTextChanged(hm, state, { id, text }) {
  const newBoard = hm.change(state.board, (b) => {
    b.cards[id].text = text;
  });
  return Object.assign({}, state, { board: newBoard });
}

function cardTextResized(hm, state, { id, height }) {
  const newBoard = hm.change(state.board, (b) => {
    const card = b.cards[id];
    card.height = height;
  });
  return Object.assign({}, state, { board: newBoard });
}

function cardInlinedImage(hm, state, { id, path, width, height }) {
  const newBoard = hm.change(state.board, (b) => {
    const card = b.cards[id];
    card.type = 'image';
    card.path = path;
    card.width = width;
    card.height = height;
    delete card.text;
  });
  return Object.assign({}, state, { board: newBoard });
}

function cardMoved(hm, state, { id, x, y }) {
  const newBoard = hm.change(state.board, (b) => {
    const card = b.cards[id];
    card.x = x;
    card.y = y;
  });
  return Object.assign({}, state, { board: newBoard });
}

function cardResized(hm, state, { id, width, height }) {
  const newBoard = hm.change(state.board, (b) => {
    const card = b.cards[id];
    card.width = width;
    card.height = height;
  });
  return Object.assign({}, state, { board: newBoard });
}

function cardSelected(hm, state, { id }) {
  return Object.assign({}, state, { selected: id });
}

function cardUniquelySelected(hm, state, { id }) {
  return cardSelected(hm, state, { id });
}

function clearSelections(hm, state) {
  return Object.assign({}, state, { selected: null });
}

function cardDeleted(hm, state, { id }) {
  const newBoard = hm.change(state.board, (b) => {
    delete b.cards[id];
  });
  return Object.assign({}, state, { board: newBoard });
}

function documentReady(hm, state, { docId, doc }) {
  // Case where app is loaded default empty doc.
  if (state.requestedDocId === '') {
    return Object.assign({}, state, {
      activeDocId: docId,
      formDocId: docId,
      requestedDocId: docId,
      board: doc,
    });
  // Case where an existing doc was opened and is still requested.
  } else if (state.requestedDocId === docId) {
    return Object.assign({}, state, {
      activeDocId: docId,
      board: doc,
    });
  }
  // Case where an existing doc was opened but is no longer requested.
  return state;
}

function documentUpdated(hm, state, { docId, doc }) {
  if (state.activeDocId !== docId) {
    return state;
  }
  return Object.assign({}, state, { board: doc });
}

function formChanged(hm, state, { docId }) {
  return Object.assign({}, state, { formDocId: docId });
}

function formSubmitted(hm, state) {
  hm.open(state.formDocId);
  return Object.assign({}, state, { requestedDocId: state.formDocId });
}

// // Reducer switch. Cases match 1:1 with action functions above.

function Reducer(hm) {
  return (state, action) => {
    log('reduce', action);

    switch (action.type) {
      case '@@redux/INIT':
        return state;

      case INITIALIZE_IF_EMPTY:
        return initializeIfEmpty(hm, state, action);

      case CARD_CREATED_TEXT:
        return cardCreatedText(hm, state, action);

      case CARD_CREATED_IMAGE:
        return cardCreatedImage(hm, state, action);

      case CARD_TEXT_CHANGED:
        return cardTextChanged(hm, state, action);

      case CARD_TEXT_RESIZED:
        return cardTextResized(hm, state, action);

      case CARD_INLINED_IMAGE:
        return cardInlinedImage(hm, state, action);

      case CARD_MOVED:
        return cardMoved(hm, state, action);

      case CARD_RESIZED:
        return cardResized(hm, state, action);

      case CARD_SELECTED:
        return cardSelected(hm, state, action);

      case CARD_UNIQUELY_SELECTED:
        return cardUniquelySelected(hm, state, action);

      case CLEAR_SELECTIONS:
        return clearSelections(hm, state, action);

      case CARD_DELETED:
        return cardDeleted(hm, state, action);

      case DOCUMENT_READY:
        return documentReady(hm, state, action);

      case DOCUMENT_UPDATED:
        return documentUpdated(hm, state, action);

      case FORM_CHANGED:
        return formChanged(hm, state, action);

      case FORM_SUBMITTED:
        return formSubmitted(hm, state, action);

      default:
        throw new Error(`Unkonwn action: ${action.type}`);
    }
  };
}

export { RootState, Reducer, maybeInlineFile, processImage, fetchImage, snapToGrid,
  BOARD_WIDTH, BOARD_HEIGHT, GRID_SIZE, CARD_MIN_WIDTH, CARD_MIN_HEIGHT, RESIZE_HANDLE_SIZE };
