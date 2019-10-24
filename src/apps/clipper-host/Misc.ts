import { Readable, Transform, TransformCallback } from 'stream'

export class FunctionTransform extends Transform {
  transformFn: Function
  constructor(transformFn: Function) {
    super({ writableObjectMode: true, readableObjectMode: true })
    this.transformFn = transformFn
  }
  async _transform(chunk: any, _encoding: any, callback: TransformCallback) {
    const res = await this.transformFn(chunk)
    callback(null, res)
  }
}

export function bufferToStream(buffer: Buffer): Readable {
  return new Readable({
    read() {
      this.push(buffer)
      this.push(null)
    },
  })
}
