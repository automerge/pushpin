
import Debug from 'debug'
import Fs from 'fs'
import Path from 'path'
import mkdirp from 'mkdirp'
import Jimp from 'jimp'
import uuid from 'uuid/v4'

import Loop from '../loop'
import * as Hyperfile from '../hyperfile'
import * as Board from './board'

const log = Debug('pushpin:image')

// XXX remove the next two lines (and then fix the bug)
export const USER = process.env.NAME || 'userA'
export const USER_PATH = Path.join('.', 'data', USER)

const HYPERFILE_DATA_PATH = Path.join(USER_PATH, 'hyperfile')
const HYPERFILE_CACHE_PATH = Path.join(USER_PATH, 'hyperfile-cache')

// ## Imperative top-levels.
mkdirp.sync(HYPERFILE_DATA_PATH)
mkdirp.sync(HYPERFILE_CACHE_PATH)

// Import the image at the given path or in the given buffer, creating a new
// image card at (x, y).
// This is structured an action for consistency. It passes through state
// unchanged. State will be updated in callbacks by redispatching to
// another action (create). We could add state to indicate in-
// progress processing here later if we wanted to.
export function importImageThenCreate(state, { path, buffer, x, y }) {
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

      Loop.dispatch(create, {
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

export function create(state, { x, y, selected, width, height, hyperfile }) {
  return Board.cardCreated(state, { x, y, selected, width, height, type: 'image', typeAttrs: { hyperfile } })
}

// Pick a resonable initial display scale for an image of given dimensions.
export function scaleImage(width, height) {
  const scaledWidth = Board.CARD_DEFAULT_WIDTH
  const scaledHeight = height * (scaledWidth / width)
  return [scaledWidth, scaledHeight]
}

export const IMAGE_DIALOG_OPTIONS = {
  properties: ['openFile'],
  filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
}

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
