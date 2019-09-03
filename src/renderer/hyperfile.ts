import Fs from 'fs'
import mime from 'mime-types'

import { Repo } from 'hypermerge'
import DiscoverySwarm from 'discovery-cloud-client'
import storage from 'random-access-file'
import { HYPERFILE_PATH } from './constants'

const repo = new Repo({ storage, path: HYPERFILE_PATH })

// DAT's discovery swarm or truly serverless discovery
// const DiscoverySwarm = require('discovery-swarm')
// const defaults = require('dat-swarm-defaults')

// const discovery = new DiscoverySwarm(defaults({ stream: repo.stream, id: repo.id }))

const url = 'wss://discovery-cloud.herokuapp.com'
const discovery = new DiscoverySwarm({ url, id: repo.id, stream: repo.stream })

repo.replicate(discovery)

export type HyperfileUrl = string & { hyperfile: true }

export interface HyperfileResult {
  data: Uint8Array
  mimeType: string
}

export function isHyperfileUrl(str: string): str is HyperfileUrl {
  return str.startsWith('hyperfile:/')
}

export function write(filePath: string): Promise<HyperfileUrl> {
  return new Promise((res, rej) => {
    Fs.readFile(filePath, (error, buffer) => {
      if (error) {
        return rej(error)
      }

      const mimeType = mime.lookup(filePath) || 'application/octet-stream'
      const hyperfileUrl = repo.writeFile(buffer, mimeType) as HyperfileUrl
      return res(hyperfileUrl)
    })
  })
}

export function writeBuffer(
  buffer: Uint8Array,
  mimeType: string = 'application/octet-stream'
): Promise<HyperfileUrl> {
  return new Promise((res) => {
    const hyperfileUrl = repo.writeFile(buffer, mimeType) as HyperfileUrl
    res(hyperfileUrl)
  })
}

export function fetch(hyperfileUrl: HyperfileUrl): Promise<HyperfileResult> {
  return new Promise((res) => {
    repo.readFile(hyperfileUrl, (data, mimeType) => {
      res({ data, mimeType })
    })
  })
}
