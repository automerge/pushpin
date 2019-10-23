import ipc from 'node-ipc'
import pump from 'pump'
import * as NativeMessaging from './NativeMessaging'
import * as JsonBuffer from './JsonBuffer'
import { FunctionTransform } from './Misc'

ipc.config.silent = true
ipc.config.appspace = `pushpin.`
ipc.config.maxConnections = 1
ipc.config.id = 'web-clipper'

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

const WEBCLIPPER_SOCKET_LOCATION = `${ipc.config.socketRoot}.pushpin.web-clipper`

function sendToPushpin(msg): Promise<any> {
  return new Promise((res, rej) => {
    // Note: we give pushpin a couple seconds to handle the message
    const timer = setTimeout(() => {
      ipc.disconnect('renderer')
      res({ type: 'Failed', details: 'Timed out.' })
    }, 2500)
    ipc.connectTo('renderer', WEBCLIPPER_SOCKET_LOCATION, () => {
      ipc.of.renderer.on('connect', () => {
        ipc.of.renderer.emit('clipper', msg)

        ipc.of.renderer.on('renderer', (msg) => {
          res(msg)
          ipc.disconnect('renderer')
          clearTimeout(timer)
        })
      })
    })
  })
}
