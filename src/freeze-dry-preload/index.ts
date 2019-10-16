import freezeDry from 'freeze-dry'
import { ipcRenderer } from 'electron'
// import FileServerClient from 'hypermerge/dist/FileServerClient'
// import * as Stream from 'hypermerge/dist/StreamLogic'
// import { FILE_SERVER_PATH } from '../renderer/constants'

// const files = new FileServerClient()
// files.setServerPath(FILE_SERVER_PATH)

window.addEventListener('load', onLoad)
window.addEventListener('beforeunload', onBeforeUnload)

async function onLoad() {
  window.removeEventListener('load', onLoad)

  const html = await freezeDry(document)
  // const { url } = await files.write(Stream.fromBuffer(Buffer.from(html, 'utf8')), 'text/html')
  ipcRenderer.sendToHost('freeze-dry', html)
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  // TODO(jeff): I'm trying to prevent navigation here, but it doesn't work:
  event.preventDefault()
  event.returnValue = 'stop'
  return 'stop'
}
