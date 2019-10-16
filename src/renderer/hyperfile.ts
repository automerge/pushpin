import { RepoFrontend, HyperfileUrl } from 'hypermerge'
import { Readable } from 'stream'
import { Header } from 'hypermerge/dist/FileStore'
import { FILE_SERVER_PATH } from './constants'

const repo = new RepoFrontend()
repo.files.setServerPath(FILE_SERVER_PATH)

export function isHyperfileUrl(str: string): str is HyperfileUrl {
  return str.startsWith('hyperfile:/')
}

export function write(stream: Readable, mimeType: string): Promise<Header> {
  return repo.files.write(stream, mimeType)
}

export async function fetch(hyperfileUrl: HyperfileUrl): Promise<[Header, Readable]> {
  return repo.files.read(hyperfileUrl)
}

// for our bad protocol implementation and our bad pdf implementation
export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((res, rej) => {
    const buffers: Buffer[] = []
    stream
      .on('data', (data: Buffer) => buffers.push(data))
      .on('error', (err: any) => rej(err))
      .on('end', () => res(Buffer.concat(buffers)))
  })
}
