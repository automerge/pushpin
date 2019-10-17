#!/usr/bin/env node
import ipc from 'node-ipc'
import pump from 'pump'
import FileServerClient from 'hypermerge/dist/FileServerClient'
import * as NativeMessaging from './NativeMessaging'
import * as JsonBuffer from './JsonBuffer'
import { FunctionTransform, bufferToStream } from './Misc'
import { InboundMessage, OutboundMessage } from './NativeMsg'

// TODO: `constants.ts` imports too many packages, so just redefine here.
const USER = process.env.NAME || process.env.USER || process.env.USERNAME
const FILE_SERVER_PATH = `/tmp/pushpin-${USER}.files`

const files = new FileServerClient()
files.setServerPath(FILE_SERVER_PATH)

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
  const capturedAt = new Date().toISOString()
  switch (message.contentType) {
    case 'HTML': {
      const header = await files.write(bufferToStream(Buffer.from(message.content)), 'text/html')
      await sendToPushpin({
        type: 'Html',
        src: message.src,
        hyperfileUrl: header.url,
        capturedAt,
      })
      break
    }
    case 'Text': {
      await sendToPushpin({
        type: 'Text',
        content: message.content,
        capturedAt,
      })
      break
    }
    case 'Image': {
      const data = getImageData(message.content)
      if (!data) throw new Error('Invalid Image data')
      const header = await files.write(bufferToStream(data.buffer), `image/${data.extension}`)
      await sendToPushpin({
        type: 'Image',
        title: 'Image',
        hyperfileUrl: header.url,
        extension: data.extension,
        capturedAt,
      })
      break
    }
  }
  return { type: 'Ack' }
}

function sendToPushpin(msg): Promise<void> {
  return new Promise((res, rej) => {
    ipc.connectTo('renderer', () => {
      ipc.of.renderer.on('connect', () => {
        ipc.of.renderer.emit('clipper', msg)
        // Note: disconnecting immediately is causing pushpin to not always
        // the message.
        // ipc.disconnect('renderer')
        res()
      })
    })
  })
}

const DATA_URL_PATTERN = /^data:.+\/(.+);base64,(.*)$/
function getImageData(content: string) {
  const match = content.match(DATA_URL_PATTERN)
  if (!match) return null
  const extension = match[1]
  const dataString = match[2]
  return {
    extension,
    buffer: Buffer.from(dataString, 'base64'),
  }
}
