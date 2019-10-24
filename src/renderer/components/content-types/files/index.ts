import Debug from 'debug'
import { Handle, HyperfileUrl } from 'hypermerge'
import path from 'path'
import ContentTypes from '../../../ContentTypes'
import FileContent from './FileContent'
import FileInList from './FileInList'

import * as ContentData from '../../../ContentData'

const log = Debug('pushpin:filecontent')

export interface FileDoc {
  title: string // names are editable and not an intrinsic part of the file
  extension: string
  hyperfileUrl: HyperfileUrl
}

// TODO: when is this ever called?
function create({ title, extension, hyperfileUrl }, handle: Handle<FileDoc>, callback) {
  handle.change((doc) => {
    doc.title = title
    doc.extension = extension
    doc.hyperfileUrl = hyperfileUrl
  })
  callback()
}

async function createFrom(contentData: ContentData.ContentData, handle: Handle<FileDoc>, callback) {
  const name = contentData.name || 'Unnamed File'
  const hyperfileUrl = await ContentData.toHyperfileUrl(contentData)

  handle.change((doc: FileDoc) => {
    const parsed = path.parse(name)
    doc.hyperfileUrl = hyperfileUrl
    doc.title = parsed.name
    doc.extension = parsed.ext.slice(1)
  })
  callback()
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
  createFrom,
})
