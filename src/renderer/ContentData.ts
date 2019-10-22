import mime from 'mime-types'
import { HyperfileUrl } from 'hypermerge'
import * as Hyperfile from './hyperfile'

export interface ContentData {
  mimeType: string
  data: ReadableStream
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
    data: stringToStream(str),
  }
}

export async function toHyperfileUrl(contentData: ContentData): Promise<HyperfileUrl> {
  const header = await Hyperfile.write(contentData.data, contentData.mimeType)
  return header.url
}

export async function toString(contentData: ContentData): Promise<string> {
  return streamToString(contentData.data)
}

async function streamToString(readable: ReadableStream): Promise<string> {
  return new Promise((res, rej) => {
    const chunks: string[] = []
    const reader = readable.getReader()
    reader.read().then(function readValue({ done, value }) {
      if (done) {
        res(chunks.join())
      } else {
        chunks.push(value)
        reader.read().then(readValue)
      }
    })
  })
}

export function stringToStream(str: string): ReadableStream {
  return new ReadableStream({
    start(controller: ReadableStreamDefaultController) {
      controller.enqueue(str)
      controller.close()
    },
  })
}
