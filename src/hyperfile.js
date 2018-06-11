import Hyperdiscovery from 'hyperdiscovery'
import Fs from 'fs'

import Multicore from './hypermerge/multicore'
import { HYPERFILE_PATH } from './constants'

const multicore = new Multicore(HYPERFILE_PATH)

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

        Hyperdiscovery(feed)
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
      Hyperdiscovery(feed)
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
