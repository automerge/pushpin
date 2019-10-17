#!/usr/bin/env node
import { pipeline, Transform, TransformCallback } from 'stream'
import ipc from 'node-ipc'
import * as NativeMessaging from './NativeMessaging'

interface InboundHtmlMessage {
  contentType: 'HTML'
  src: string
  content: string
}

interface InboundTextMessage {
  contentType: 'Text'
  content: string
}

interface InboundImageMessage {
  contentType: 'Image'
  content: string
}

type InboundMessage = InboundHtmlMessage | InboundTextMessage | InboundImageMessage

interface AckMessage {
  type: 'Ack'
}
type OutboundMessage = AckMessage

// TODO: Handle FileServer errors.
// const htmlStream = process.stdin.pipe(new ClipperTransform())
// // TODO: 'text/html' may not be correct
// const url = await files.write(htmlStream, 0, 'text/html')

class FunctionTransform extends Transform {
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

const USER = process.env.NAME || process.env.USER || process.env.USERNAME
ipc.config.silent = true
ipc.config.appspace = `pushpin.${USER}.`
// ipc.config.maxRetries = 2
ipc.config.maxConnections = 1
ipc.config.id = 'clipper'

const inboundStream = new NativeMessaging.InboundTransform()
const onMessageTransform = new FunctionTransform(onMessage)
const outboundStream = new NativeMessaging.OutboundTransform()
// TODO: `pipelien` support added node v10
pipeline(process.stdin, inboundStream, onMessageTransform, outboundStream, process.stdout)

async function onMessage(message: InboundMessage): Promise<OutboundMessage> {
  switch (message.contentType) {
    case 'HTML': {
      await sendToPushpin({ html: true })
      break
    }
    case 'Text': {
      await sendToPushpin({ html: true })
      break
    }
    case 'Image': {
      await sendToPushpin({ html: true })
      break
    }
  }
  return { type: 'Ack' }
}

function sendToPushpin(msg): Promise<void> {
  return new Promise((res, rej) => {
    ipc.connectTo('renderer', () => {
      ipc.of.renderer.on('connect', () => {
        ipc.of.renderer.emit('message', msg)
        ipc.disconnect('renderer')
        res()
      })
    })
  })
}
