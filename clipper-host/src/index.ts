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

function sendToPushpin(msg): Promise<any> {
  return new Promise((res, rej) => {
    ipc.connectTo('renderer', () => {
      ipc.of.renderer.on('connect', () => {
        ipc.of.renderer.emit('clipper', msg)
        // Note: we give pushpin a couple seconds to handle the message
        const timer = setTimeout(() => {
          ipc.disconnect('renderer')
          res({ type: 'Failed', details: 'Timed out.' })
        }, 2500)
        ipc.of.renderer.on('renderer', (msg) => {
          res(msg)
          clearTimeout(timer)
        })
      })
    })
  })
}
