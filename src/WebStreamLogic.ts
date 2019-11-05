/**
 * Web Stream Logic and Helpers.
 * *Not* Node streams!
 * https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
 *
 * TODO: Use a polyfill for browser compatibility (e.g. https://github.com/MattiasBuelens/web-streams-polyfill)
 */
import base64 from 'base64-js'

class PolyfillTextEncoderTransformer implements Transformer {
  encoder = new TextEncoder()
  transform(chunk, controller) {
    controller.enqueue(this.encoder.encode(chunk))
  }
}
export function textEncoderStream() {
  if (window.TextDecoderStream) return new window.TextEncoderStream()
  return new window.TransformStream(new PolyfillTextEncoderTransformer())
}

class PolyfillTextDecoderTransformer implements Transformer {
  decoder: TextDecoder = new TextDecoder()
  transform(chunk, controller) {
    controller.enqueue(this.decoder.decode(chunk))
  }
}
export function textDecoderStream() {
  if (window.TextDecoderStream) return new window.TextDecoderStream()
  return new window.TransformStream(new PolyfillTextDecoderTransformer())
}

export class DecodeUriComponentTransformer implements Transformer {
  transform(chunk, controller) {
    controller.enqueue(decodeURIComponent(chunk))
  }
}
export function decodeUriComponentStream() {
  return new window.TransformStream(new DecodeUriComponentTransformer())
}

export async function toString(readable: ReadableStream<Uint8Array>): Promise<string> {
  return new Promise((res, rej) => {
    const reader = readable.pipeThrough(textDecoderStream()).getReader()
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
  }).pipeThrough(textEncoderStream())
}

export function fromBase64(b64: string): ReadableStream<Uint8Array> {
  const byteArray = base64.toByteArray(b64)
  // TODO(matt): Consider making our own readable stream instead of using
  // blob.
  const blob = new Blob([byteArray])
  return blob.stream()
}
