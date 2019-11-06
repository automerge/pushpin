import React, { useRef } from 'react'
import Content, { ContentProps } from '../../Content'
import * as ContentTypes from '../../../ContentTypes'
import { useDocument, useHyperfileHeader } from '../../../Hooks'
import { createDocumentLink } from '../../../ShareLink'
import { FileDoc } from '.'

import './FileContent.css'
import TitleEditor from '../../TitleEditor'
import Badge from '../../Badge'

function humanFileSize(size: number) {
  const i = size ? Math.floor(Math.log(size) / Math.log(1024)) : 0
  return `${(size / 1024 ** i).toFixed(1)} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`
}

interface Props extends ContentProps {
  editable: boolean
}

export default function FileContent({ hypermergeUrl, context, editable, url }: Props) {
  const [doc] = useDocument<FileDoc>(hypermergeUrl)
  const badgeRef = useRef<HTMLDivElement>(null)

  const { title = '', hyperfileUrl = null } = doc || {}

  const header = useHyperfileHeader(hyperfileUrl)

  if (!hyperfileUrl || !header) {
    return null
  }

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', url)

    if (badgeRef.current) {
      e.dataTransfer.setDragImage(badgeRef.current, 0, 0)
    }
  }

  const { size, mimeType } = header

  function renderUnidentifiedFile() {
    switch (context) {
      case 'list':
        return (
          <div draggable onDragStart={onDragStart} className="FileListItem">
            <Badge ref={badgeRef} shape="square" icon="files-o" />
            {editable ? (
              <TitleEditor url={hypermergeUrl} />
            ) : (
              <div className="FileListItem__title">{title}</div>
            )}
          </div>
        )
      default:
        return (
          <div className="FileContent">
            <Badge ref={badgeRef} size="large" shape="square" icon="files-o" />
            <div className="Caption">
              <span className="Title">{title}</span>
              <br />
              {`${size !== null ? humanFileSize(size) : 'unknown size'}`}
            </div>
          </div>
        )
    }
  }

  const contentType = ContentTypes.mimeTypeToContentType(mimeType)
  const contextRenderer = contentType.contexts[context]

  if (contentType.type !== 'file' && contextRenderer) {
    return (
      <Content
        context={context}
        editable={editable}
        url={createDocumentLink(contentType.type, hypermergeUrl)}
      />
    )
  }
  return renderUnidentifiedFile()
}

FileContent.minWidth = 6
FileContent.minHeight = 6
FileContent.defaultWidth = 18
FileContent.maxWidth = 72
FileContent.maxHeight = 72
