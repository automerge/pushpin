import { Transform, TransformCallback } from 'stream'

export class ParseTransform extends Transform {
  constructor() {
    super({ readableObjectMode: true })
  }
  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback) {
    callback(null, JSON.parse(chunk.toString()))
  }
}

export class BufferifyTransform extends Transform {
  constructor() {
    super({ writableObjectMode: true })
  }
  _transform(chunk: any, _encoding: string, callback: TransformCallback) {
    callback(null, Buffer.from(JSON.stringify(chunk)))
  }
}
