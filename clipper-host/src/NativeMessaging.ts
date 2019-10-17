import { Transform, TransformCallback } from 'stream'

export class InboundTransform extends Transform {
  size?: number
  buffer: Buffer
  constructor() {
    super({ readableObjectMode: true })
    this.buffer = Buffer.alloc(0)
  }
  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback) {
    // TODO: what are the performance characteristics of this?
    this.buffer = Buffer.concat([this.buffer, chunk])
    this.parse()
    callback()
  }
  parse() {
    if (this.size === undefined && this.buffer.length >= 4) {
      this.size = this.buffer.readUInt32LE(0)
      this.buffer = this.buffer.slice(4)
    }

    if (this.size && this.buffer.length >= this.size) {
      const message = this.buffer.slice(0, this.size)
      this.buffer = this.buffer.slice(this.size)
      this.size = undefined
      this.push(JSON.parse(message.toString()))
      this.parse() // Parse the rest of the buffer
    }
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
