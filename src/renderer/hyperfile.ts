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
