#!/usr/bin/env node
import ipc from 'node-ipc'
import pump from 'pump'
import * as NativeMessaging from './NativeMessaging'
import * as JsonBuffer from './JsonBuffer'
import { FunctionTransform } from './Misc'

// TODO: `constants.ts` imports too many packages, so just redefine here.
const USER = process.env.NAME || process.env.USER || process.env.USERNAME

ipc.config.silent = true
ipc.config.appspace = `pushpin.${USER}.`
// ipc.config.maxRetries = 2
ipc.config.maxConnections = 1
ipc.config.id = 'clipper'

const inboundMessages = new NativeMessaging.InboundTransform()
const jsonParse = new JsonBuffer.ParseTransform()
const onMessageTransform = new FunctionTransform(sendToPushpin)
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

// async function onMessage(message: InboundMessage): Promise<any> {
//   await sendToPushpin(message)
//   return { type: 'Ack2' }
// }

function sendToPushpin(msg): Promise<any> {
  return new Promise((res, rej) => {
    ipc.connectTo('renderer', () => {
      ipc.of.renderer.on('connect', () => {
        ipc.of.renderer.emit('clipper', msg)
        // Note: we delay a little while here to give the message time to send.
        setTimeout(() => ipc.disconnect('renderer'), 250)
        res({ type: 'Ack' })
      })
    })
  })
}
