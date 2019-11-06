/**
 * Web Stream Logic and Helpers.
 * *Not* Node streams!
 * https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
 */
import base64 from 'base64-js'

export class DecodeUriComponentStream extends window.TransformStream {
  constructor() {
    super({
      start() {},
      transform(chunk: string, controller: TransformStreamDefaultController) {
        controller.enqueue(decodeURIComponent(chunk))
      },
    })
  }
}

export async function toString(readable: ReadableStream<Uint8Array>): Promise<string> {
  return new Promise((res, rej) => {
    const reader = readable.pipeThrough(new window.TextDecoderStream()).getReader()
    const chunks: string[] = []
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

export function fromString(str: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller: ReadableStreamDefaultController) {
      controller.enqueue(str)
      controller.close()
    },
  }).pipeThrough(new window.TextEncoderStream())
}

export function fromBase64(b64: string): ReadableStream<Uint8Array> {
  const byteArray = base64.toByteArray(b64)
  // TODO(matt): Consider making our own readable stream instead of using
  // blob.
  const blob = new Blob([byteArray])
  return blob.stream()
}
