import React from 'react'
import mime from 'mime-types'
import Content, { ContentProps } from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { useDocument, useHyperfile } from '../../../Hooks'
import { createDocumentLink } from '../../../ShareLink'
import { FileDoc } from '.'

import './FileContent.css'

function humanFileSize(size: number) {
  const i = size ? Math.floor(Math.log(size) / Math.log(1024)) : 0
  return `${(size / 1024 ** i).toFixed(1)} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`
}

export default function FileContent({ hypermergeUrl, context }: ContentProps) {
  const [doc] = useDocument<FileDoc>(hypermergeUrl)

  const { title = '', hyperfileUrl = null } = doc || {}

  const fileData = useHyperfile(hyperfileUrl)

  if (!hyperfileUrl) {
    return null
  }

  const size = fileData ? fileData.size : null

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', createDocumentLink('file', hypermergeUrl))
    if (!fileData) {
      return
    }
    const { mimeType } = fileData
    const extension = mime.extension(mimeType) || ''

    e.dataTransfer.setData('DownloadURL', `text:${title}.${extension}:${hyperfileUrl}`)
  }

  function renderUnidentifiedFile() {
    // i removed the draggable from the onDragStart for now
    return (
      <div className="FileContent">
        <div className="Icon" onDragStart={onDragStart}>
          <i className="fa fa-file " />
        </div>
        <div className="Caption">
          <span className="Title">{title}</span>
          <br />
          {`${size !== null ? humanFileSize(size) : 'unknown size'}`}
        </div>
      </div>
    )
  }

  const { mimeType = null } = fileData || {}

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
