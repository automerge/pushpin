import Fs from 'fs'
import mime from 'mime-types'

import { Repo, HyperfileUrl } from 'hypermerge'
import DiscoverySwarm from 'discovery-cloud-client'
import storage from 'random-access-file'
import { Readable } from 'stream'
import { HYPERFILE_PATH } from './constants'

const repo = new Repo({ storage, path: HYPERFILE_PATH, serverPath: '/tmp/pushpin.files' })

// DAT's discovery swarm or truly serverless discovery
// const DiscoverySwarm = require('discovery-swarm')
// const defaults = require('dat-swarm-defaults')

// const discovery = new DiscoverySwarm(defaults({ stream: repo.stream, id: repo.id }))

const url = 'wss://discovery-cloud.herokuapp.com'
const discovery = new DiscoverySwarm({ url, id: repo.id, stream: repo.stream })

repo.setSwarm(discovery as any)

export interface HyperfileResult {
  data: Readable
  mimeType: string
  size: number
}

export function isHyperfileUrl(str: string): str is HyperfileUrl {
  return str.startsWith('hyperfile:/')
}

export function write(stream: Readable, size: number, mimeType: string): Promise<HyperfileUrl> {
  return repo.files.write(stream, size, mimeType)
}

export function writeFromPath(filePath: string): Promise<HyperfileUrl> {
  return new Promise((res, rej) => {
    Fs.lstat(filePath, async (err, stats) => {
      if (err) return rej(err)
      const stream = Fs.createReadStream(filePath)
      const mimeType = mime.lookup(filePath) || 'application/octet-stream'
      const hyperfileUrl = await repo.files.write(stream, stats.size, mimeType)
      return res(hyperfileUrl)
    })
  })
}

export function writeBuffer(
  buffer: Uint8Array,
  mimeType: string = 'application/octet-stream'
): Promise<HyperfileUrl> {
  return new Promise(async (res) => {
    const stream = bufferToStream(Buffer.from(buffer))
    const size = buffer.length
    const hyperfileUrl = await repo.files.write(stream, size, mimeType)
    res(hyperfileUrl)
  })
}

export async function fetch(hyperfileUrl: HyperfileUrl): Promise<[Readable, string, number]> {
  return repo.files.read(hyperfileUrl)
}

function bufferToStream(buffer: Buffer): Readable {
  return new Readable({
    read() {
      this.push(buffer)
      this.push(null)
    },
  })
}
