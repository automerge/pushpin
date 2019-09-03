import React from 'react'
import Debug from 'debug'

import { remote } from 'electron'
import { Handle } from 'hypermerge'
import mime from 'mime-types'
import path from 'path'
import * as Hyperfile from '../../hyperfile'
import Content, { ContentProps } from '../Content'
import ContentTypes from '../../ContentTypes'
import { useDocument, useHyperfile } from '../../Hooks'
import { FILE_DIALOG_OPTIONS } from '../../constants'
import { createDocumentLink } from '../../ShareLink'

import './FileContent.css'

const { dialog } = remote

const log = Debug('pushpin:filecontent')

export interface FileDoc {
  name: string // names are editable and not an intrinsic part of the file
  hyperfileUrl: Hyperfile.HyperfileUrl
  mimeType: string
}

function humanFileSize(size: number) {
  const i = size ? Math.floor(Math.log(size) / Math.log(1024)) : 0
  return `${(size / 1024 ** i).toFixed(1)} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`
}

export default function FileContent({ hypermergeUrl, context }: ContentProps) {
  const [doc] = useDocument<FileDoc>(hypermergeUrl)

  const { name = '', hyperfileUrl = null } = doc || {}

  const fileData = useHyperfile(hyperfileUrl)

  if (!hyperfileUrl) {
    return null
  }

  const size =
    fileData && fileData.data && fileData.data.buffer ? fileData.data.buffer.byteLength : null

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', createDocumentLink('file', hypermergeUrl))
    if (!fileData) {
      return
    }
    const { data, mimeType } = fileData
    const blob = new Blob([data.buffer], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const extension = mime.extension(mimeType) || ''

    e.dataTransfer.setData('DownloadURL', `text:${name}.${extension}:${url}`)
  }

  function renderUnidentifiedFile() {
    return (
      <div className="FileContent">
        <div className="Icon" draggable onDragStart={onDragStart}>
          <i className="fa fa-file " />
        </div>
        <div className="Caption">
          <span className="Title">{name}</span>
          <br />
          {`${size !== null ? humanFileSize(size) : 'unknown size'}`}
        </div>
      </div>
    )
  }

  const { mimeType = null } = doc || {}

  const contentType = ContentTypes.mimeTypeToContentType(mimeType)
  if (contentType !== 'file') {
    return <Content context={context} url={createDocumentLink(contentType, hypermergeUrl)} />
  }
  return renderUnidentifiedFile()
}

FileContent.minWidth = 6
FileContent.minHeight = 6
FileContent.defaultWidth = 18
FileContent.maxWidth = 72
FileContent.maxHeight = 72

interface Attrs {
  hyperfileUrl: string
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
          doc.mimeType = entry.type // this... shouldn't need to happen here
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
  dialog.showOpenDialog(FILE_DIALOG_OPTIONS, (paths) => {
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
          // where do i get a real mimetype here?
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
  icon: 'file',
  contexts: {
    workspace: FileContent,
    board: FileContent,
  },
  create,
  createFromFile,
})
