import Fs from 'fs'
import mime from 'mime-types'

import { Repo } from 'hypermerge'
import DiscoverySwarm from 'discovery-cloud-client'
import { HYPERFILE_PATH } from './constants'
import storage from 'random-access-file'

const repo = new Repo({ storage, path: HYPERFILE_PATH, })

// DAT's discovery swarm or truly serverless discovery
// const DiscoverySwarm = require('discovery-swarm')
// const defaults = require('dat-swarm-defaults')

// const discovery = new DiscoverySwarm(defaults({ stream: repo.stream, id: repo.id }))

const url = 'wss://discovery-cloud.herokuapp.com'
const discovery = new DiscoverySwarm({ url, id: repo.id, stream: repo.stream })

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
