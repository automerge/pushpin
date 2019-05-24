import Fs from 'fs'
import mime from 'mime-types'

import { Repo } from 'hypermerge'
import { HYPERFILE_PATH } from './constants'

const storage = require('random-access-file')

const repo = new Repo({ HYPERFILE_PATH, storage })

// DAT's discovery swarm or truly serverless discovery
const DiscoverySwarm = require('discovery-swarm')
const defaults = require('dat-swarm-defaults')

const discovery = new DiscoverySwarm(defaults({ stream: repo.stream, id: repo.id }))

repo.replicate(discovery)

// callback = (err, hyperfileId)
export function write(filePath, callback) {
  Fs.readFile(filePath, (error, buffer) => {
    if (error) {
      callback(error)
      return
    }

    const mimeType = mime.lookup(filePath) || 'application/octet-stream'
    const hyperfileUrl = repo.writeFile(buffer, mimeType)
    callback(null, hyperfileUrl)
  })
}

export function writeBuffer(buffer, callback) {
  const hyperfileUrl = repo.writeFile(buffer, 'application/octet-stream') // TODO: mime type
  callback(null, hyperfileUrl)
}

// callback = (err, blob)
export function fetch(hyperfileId, callback) {
  repo.readFile(hyperfileId, (error, data) => {
    if (error) {
      callback(error)
      return
    }

    callback(null, data)
  })
}
