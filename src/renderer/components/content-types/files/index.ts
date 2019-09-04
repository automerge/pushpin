import Debug from 'debug'
import { Handle, HyperfileUrl } from 'hypermerge'
import mime from 'mime-types'
import ContentTypes from '../../../ContentTypes'
import FileContent from './FileContent'
import FileInList from './FileInList'

import * as Hyperfile from '../../../hyperfile'

const log = Debug('pushpin:filecontent')

export interface FileDoc {
  title: string // names are editable and not an intrinsic part of the file
  hyperfileUrl: HyperfileUrl
}

function createFromFile(entry: File, handle: Handle<FileDoc>, callback) {
  const reader = new FileReader()
  const { name = 'Unnamed File' } = entry

  reader.onload = () => {
    const buffer = Buffer.from(reader.result as ArrayBuffer)
    const mimeType = mime.contentType(entry.type) || 'application/octet-stream'
    Hyperfile.writeBuffer(buffer, mimeType)
      .then((hyperfileUrl) => {
        handle.change((doc) => {
          doc.hyperfileUrl = hyperfileUrl
          doc.title = name
        })
        callback()
      })
      .catch((err) => {
        log(err)
      })
  }

  reader.readAsArrayBuffer(entry)
}

ContentTypes.register({
  type: 'file',
  name: 'File',
  icon: 'file-o',
  unlisted: true,
  contexts: {
    workspace: FileContent,
    board: FileContent,
    list: FileInList,
  },
  createFromFile,
})
