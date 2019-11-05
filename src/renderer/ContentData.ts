import mime from 'mime-types'
import { HyperfileUrl } from 'hypermerge'
import * as Hyperfile from './hyperfile'
import * as WebStreamLogic from '../WebStreamLogic'

export interface ContentData {
  mimeType: string
  data: ReadableStream<Uint8Array>
  src?: string
  name?: string
  extension?: string
}

export function fromFile(file: File) {
  return {
    name: file.name,
    mimeType: mime.contentType(file.type) || 'application/octet-stream',
    data: file.stream(),
  }
}

export function fromString(str: string, mimeType: string = 'text/plain') {
  return {
    mimeType,
    data: WebStreamLogic.fromString(str),
  }
}

export async function toHyperfileUrl(contentData: ContentData): Promise<HyperfileUrl> {
  const header = await Hyperfile.write(contentData.data, contentData.mimeType)
  return header.url
}
