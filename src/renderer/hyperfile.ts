import Fs from 'fs'
import mime from 'mime-types'

import { RepoFrontend, HyperfileUrl } from 'hypermerge'
import { Readable } from 'stream'
import { FILE_SERVER_PATH } from './constants'

const repo = new RepoFrontend()
repo.setFileServerPath(FILE_SERVER_PATH)

export interface HyperfileResult {
  data: Readable
  mimeType: string
  size: number
}

export interface BufferedHyperfileResult {
  data: Buffer
  mimeType: string
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

export function bufferToStream(buffer: Buffer): Readable {
  return new Readable({
    read() {
      this.push(buffer)
      this.push(null)
    },
  })
}

export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((res, rej) => {
    const buffers: Buffer[] = []
    stream
      .on('data', (data: Buffer) => buffers.push(data))
      .on('error', (err: any) => rej(err))
      .on('end', () => res(Buffer.concat(buffers)))
  })
}
