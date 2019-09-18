import { Readable } from 'stream'

export function toNodeReadable(stream: ReadableStream): Readable {
  return new NodeReadable(stream, {})
}

export class NodeReadable extends Readable {
  private webStream: ReadableStream
  private reader: ReadableStreamDefaultReader
  private reading: boolean

  constructor(webStream: ReadableStream, options: any) {
    super(options)
    this.webStream = webStream
    this.reader = webStream.getReader()
    this.reading = false
  }

  _read(size: number) {
    if (this.reading) {
      return
    }
    this.reading = true
    this.doRead(size)
  }

  doRead(size: number) {
    this.reader
      .read()
      .then(({ done, value }: { done: boolean; value: any }) => {
        if (done) {
          this.push(null)
          return
        }
        if (this.push(value)) {
          this.doRead(size)
          return
        }
        this.reading = false
      })
      .catch((e) => {
        this.emit('error', e)
      })
  }
}
