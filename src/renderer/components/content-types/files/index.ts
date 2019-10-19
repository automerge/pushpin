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

interface FileMetadata {
  naturalWidth?: number
  naturalHeight?: number
}

export interface FileDoc {
  title: string // names are editable and not an intrinsic part of the file
  extension: string
  hyperfileUrl: HyperfileUrl
  metadata?: FileMetadata
}

async function deriveMetadata(entry: File): Promise<FileMetadata | undefined> {
  if (entry.type.startsWith('image/')) {
    const img = new Image
    img.src = URL.createObjectURL(entry)
    try {
      await img.decode()
      return { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }
    } catch {
      return undefined
    }
  }
  return Promise.resolve(undefined)
}

function createFromFile(entry: File, handle: Handle<FileDoc>, callback) {
  const { name = 'Unnamed File' } = entry

  const fileStream = toNodeReadable(entry.stream())
  const mimeType = mime.contentType(entry.type) || 'application/octet-stream'

  Promise.all([
    Hyperfile.write(fileStream, mimeType),
    deriveMetadata(entry),
  ])
    .then(([{ url }, metadata]) => {
      handle.change((doc: FileDoc) => {
        const parsed = path.parse(name)
        doc.hyperfileUrl = url
        doc.title = parsed.name
        doc.extension = parsed.ext.slice(1)
        doc.metadata = metadata
      })
      if (metadata && metadata.naturalWidth && metadata.naturalHeight)
        callback({ width: metadata.naturalWidth, height: metadata.naturalHeight })
      else
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
  createFromFile,
})
