import React, { useRef } from 'react'
import Content, { ContentProps } from '../../Content'
import * as ContentTypes from '../../../ContentTypes'
import { useDocument, useHyperfileHeader } from '../../../Hooks'
import { createDocumentLink } from '../../../ShareLink'
import { FileDoc } from '.'

import './FileContent.css'
import Badge from '../../Badge'
import ListItem from '../../ListItem'
import ContentDragHandle from '../../ContentDragHandle'
import TitleWithSubtitle from '../../TitleWithSubtitle'

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

  const { title = '', extension, hyperfileUrl } = doc || {}

  const header = useHyperfileHeader(hyperfileUrl || null)

  if (!hyperfileUrl || !header) {
    return null
  }
  const { size, mimeType } = header

  function renderUnidentifiedFile() {
    switch (context) {
      case 'list':
        return (
          <ListItem>
            <ContentDragHandle
              url={url}
              filename={title}
              extension={extension}
              hyperfileUrl={hyperfileUrl}
            >
              <Badge shape="square" icon="files-o" />
            </ContentDragHandle>
            <TitleWithSubtitle
              title={title}
              subtitle={`${size !== null ? humanFileSize(size) : 'unknown size'}`}
              hypermergeUrl={hypermergeUrl}
              editable={editable}
            />
          </ListItem>
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
