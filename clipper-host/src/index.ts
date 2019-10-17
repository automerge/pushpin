#!/usr/bin/env node
import ipc from 'node-ipc'
import pump from 'pump'
import * as NativeMessaging from './NativeMessaging'
import * as JsonBuffer from './JsonBuffer'
import { FunctionTransform } from './Misc'
import { InboundMessage, OutboundMessage } from './NativeMsg'

// TODO: `constants.ts` imports too many packages, so just redefine here.
const USER = process.env.NAME || process.env.USER || process.env.USERNAME

ipc.config.silent = true
ipc.config.appspace = `pushpin.${USER}.`
// ipc.config.maxRetries = 2
ipc.config.maxConnections = 1
ipc.config.id = 'clipper'

const inboundMessages = new NativeMessaging.InboundTransform()
const jsonParse = new JsonBuffer.ParseTransform()
const onMessageTransform = new FunctionTransform(onMessage)
const jsonBufferify = new JsonBuffer.BufferifyTransform()
const outboundMessages = new NativeMessaging.OutboundTransform()

// TODO: `pipeline` support added node v10, when can we use it? What
pump(
  process.stdin,
  inboundMessages,
  jsonParse,
  onMessageTransform,
  jsonBufferify,
  outboundMessages,
  process.stdout
)

async function onMessage(message: InboundMessage): Promise<OutboundMessage> {
  switch (message.contentType) {
    case 'HTML': {
      await sendToPushpin(message)
      break
    }
    case 'Text': {
      await sendToPushpin(message)
      break
    }
    case 'Image': {
      await sendToPushpin(message)
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
        // Note: disconnecting immediately is causing pushpin to not always
        // the message.
        // ipc.disconnect('renderer')
        res()
      })
    })
  })
}
