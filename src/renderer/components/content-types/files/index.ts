import Debug from 'debug'
import { Handle, HyperfileUrl } from 'hypermerge'
import mime from 'mime-types'
import path from 'path'
import ContentTypes from '../../../ContentTypes'
import FileContent from './FileContent'
import FileInList from './FileInList'

import * as Hyperfile from '../../../hyperfile'
import { toNodeReadable } from '../../../../NodeReadable'

const log = Debug('pushpin:filecontent')

export interface FileDoc {
  title: string // names are editable and not an intrinsic part of the file
  extension: string
  hyperfileUrl: HyperfileUrl
}

function create({ title, extension, hyperfileUrl }, handle: Handle<FileDoc>, callback) {
  handle.change((doc) => {
    doc.title = title
    doc.extension = extension
    doc.hyperfileUrl = hyperfileUrl
  })
  callback()
}

function createFromFile(entry: File, handle: Handle<FileDoc>, callback) {
  const { name = 'Unnamed File' } = entry

  // XXX: fix this any type
  const fileStream = toNodeReadable((entry as any).stream())
  const mimeType = mime.contentType(entry.type) || 'application/octet-stream'

  Hyperfile.write(fileStream, mimeType)
    .then(({ url }) => {
      handle.change((doc: FileDoc) => {
        const parsed = path.parse(name)
        doc.hyperfileUrl = url
        doc.title = parsed.name
        doc.extension = parsed.ext.slice(1)
      })
      callback()
    })
    .catch((err) => {
      log(err)
    })
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
  create,
  createFromFile,
})
