import { Transform, TransformCallback } from 'stream'

export class InboundTransform extends Transform {
  messageSize?: number
  buffers: Buffer[]
  bufferSize: number
  constructor() {
    super({ readableObjectMode: true })
    this.buffers = []
    this.bufferSize = 0
  }
  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback) {
    this.buffers.push(chunk)
    this.bufferSize += chunk.length
    this.parse()
    callback()
  }
  private parse() {
    if (this.messageSize === undefined && this.bufferSize >= 4) {
      const header = this.slice(4)
      this.messageSize = header.readUInt32LE(0)
    }
    if (this.messageSize && this.bufferSize >= this.messageSize) {
      const message = this.slice(this.messageSize)
      this.messageSize = undefined
      this.push(JSON.parse(message.toString()))
      this.parse() // Parse the rest of the buffer
    }
  }
  private slice(length: number) {
    const buffer = Buffer.concat(this.buffers)
    const sliced = buffer.slice(0, length)
    const remaining = buffer.slice(length)
    this.buffers = [remaining]
    this.bufferSize = remaining.length
    return sliced
  }
}

export class OutboundTransform extends Transform {
  constructor() {
    super({ writableObjectMode: true })
  }
  _transform(chunk: any, _encoding: string, callback: TransformCallback) {
    const message = Buffer.from(JSON.stringify(chunk))
    const length = Buffer.alloc(4)
    length.writeUInt32LE(message.length, 0)
    callback(null, Buffer.concat([length, message]))
  }
}
