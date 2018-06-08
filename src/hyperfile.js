import Hypercore from 'hypercore'
import Hyperdiscovery from 'hyperdiscovery'
import Fs from 'fs'
import Path from 'path'
import mkdirp from 'mkdirp'
import Multicore from './hypermerge/multicore'

import { HYPERFILE_DATA_PATH } from './constants'

const multicore = new Multicore(HYPERFILE_DATA_PATH)
const hypercoreOptions = { valueEncoding: 'binary' }

function corePath(dataPath, imgId) {
  return Path.join(dataPath, imgId)
}

function serve(hypercore) {
  Hyperdiscovery(hypercore)
}

// callback = (err, key)
export function write(filePath, callback) {
  multicore.ready(() => {
    const feed = multicore.createFeed()

    Fs.readFile(filePath, (error, buffer) => {
      if (error) {
        callback(error)
        return
      }

      feed.append(buffer, (error) => {
        if (error) {
          callback(error)
          return
        }

        const hyperfileId = feed.key.toString('hex')

        serve(feed)
        callback(null, hyperfileId)
      })
    })
  })
}

// callback = (err, blob)
export function fetch(hyperfileId, callback) {
  multicore.ready(() => {
    const feedKey = Buffer.from(hyperfileId, 'hex')
    const feed = multicore.createFeed(feedKey)

    feed.on('error', callback)
    feed.ready(() => {
      serve(feed)
      feed.get(0, null, (error, data) => {
        if (error) {
          callback(error)
          return
        }

        callback(null, data)
      })
    })
  })
}
