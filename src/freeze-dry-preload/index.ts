import freezeDry from 'freeze-dry'
import { ipcRenderer } from 'electron'
import Queue from 'hypermerge/dist/Queue'
import FileServerClient from 'hypermerge/dist/FileServerClient'
import * as Stream from 'hypermerge/dist/StreamLogic'
import { FILE_SERVER_PATH } from '../renderer/constants'

const files = new FileServerClient()
files.setServerPath(FILE_SERVER_PATH)

type Msg = ReadyMsg
interface ReadyMsg {
  type: 'Ready'
}

const messageQ = new Queue<Msg>('freeze-dry-preload:messageQ')

ipcRenderer.on('freeze-dry', (_event, msg: Msg) => {
  messageQ.push(msg)
})

messageQ.first().then(capturePage)

async function capturePage() {
  const html = await freezeDry(document)
  const { url } = await files.write(Stream.fromBuffer(Buffer.from(html, 'utf8')), 'text/html')
  ipcRenderer.sendToHost('freeze-dry', url)
}

window.addEventListener('beforeunload', onBeforeUnload)

function onBeforeUnload(event: BeforeUnloadEvent) {
  // TODO(jeff): I'm trying to prevent navigation here, but it doesn't work:
  event.preventDefault()
  event.returnValue = 'stop'
  return 'stop'
}
