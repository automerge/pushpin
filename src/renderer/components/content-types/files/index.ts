import Debug from 'debug'
import path from 'path'
import { remote } from 'electron'
import { Handle } from 'hypermerge'
import ContentTypes from '../../../ContentTypes'
import FileContent from './FileContent'
import FileInList from './FileInList'

import * as Hyperfile from '../../../hyperfile'

const { dialog } = remote

const log = Debug('pushpin:filecontent')

export interface FileDoc {
  name: string // names are editable and not an intrinsic part of the file
  hyperfileUrl: Hyperfile.HyperfileUrl
}

function createFromFile(entry: File, handle: Handle<FileDoc>, callback) {
  const reader = new FileReader()
  const { name = 'Unnamed File' } = entry

  reader.onload = () => {
    const buffer = Buffer.from(reader.result as ArrayBuffer)
    Hyperfile.writeBuffer(buffer, entry.type)
      .then((hyperfileUrl) => {
        handle.change((doc) => {
          doc.hyperfileUrl = hyperfileUrl
          doc.name = name
        })
        callback()
      })
      .catch((err) => {
        log(err)
      })
  }

  reader.readAsArrayBuffer(entry)
}

function create(attrs, handle: Handle<FileDoc>, callback) {
  dialog.showOpenDialog({ properties: ['openFile'] }, (paths) => {
    // User aborted.
    if (!paths) {
      return
    }
    if (paths.length !== 1) {
      throw new Error('Expected exactly one path?')
    }

    const filePath = paths[0]
    const name = path.parse(filePath).base

    Hyperfile.write(filePath)
      .then((hyperfileUrl) => {
        handle.change((doc) => {
          doc.hyperfileUrl = hyperfileUrl
          doc.name = name
        })

        callback()
      })
      .catch((err) => {
        log(err)
      })
  })
}

ContentTypes.register({
  type: 'file',
  name: 'File',
  icon: 'file-o',
  contexts: {
    workspace: FileContent,
    board: FileContent,
    list: FileInList,
  },
  create,
  createFromFile,
})
