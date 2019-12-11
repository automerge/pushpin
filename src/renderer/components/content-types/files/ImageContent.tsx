/* eslint-disable jsx-a11y/alt-text */
/* our unfluff images don't have meaningful alt-text aside from the title */
import React from 'react'
import { FileDoc } from '.'

import { ContentProps } from '../../Content'
import * as ContentTypes from '../../../ContentTypes'
import { useDocument, useHyperfileHeader } from '../../../Hooks'
import Badge from '../../ui/Badge'
import ListItem from '../../ui/ListItem'
import ContentDragHandle from '../../ui/ContentDragHandle'
import TitleWithSubtitle from '../../ui/TitleWithSubtitle'

function humanFileSize(size: number) {
  const i = size ? Math.floor(Math.log(size) / Math.log(1024)) : 0
  return `${(size / 1024 ** i).toFixed(1)} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`
}

export default function ImageContent({ hypermergeUrl }: ContentProps) {
  const [doc] = useDocument<FileDoc>(hypermergeUrl)

  if (!doc) {
    return null
  }
  if (!doc.hyperfileUrl) {
    return null
  }

  return <img className="Image" alt="" src={doc.hyperfileUrl} />
}

interface Props extends ContentProps {
  editable: boolean
}

function ImageInList(props: Props) {
  const { hypermergeUrl, editable, url } = props
  const [doc] = useDocument<FileDoc>(hypermergeUrl)

  const { title = '', hyperfileUrl = null, extension } = doc || {}
  const header = useHyperfileHeader(hyperfileUrl)

  if (!hyperfileUrl) {
    return null
  }

  const { size = null } = header || {}

  const subtitle = `${size !== null ? humanFileSize(size) : 'unknown size'}`

  return (
    <ListItem>
      <ContentDragHandle
        url={url}
        filename={title}
        extension={extension}
        hyperfileUrl={hyperfileUrl}
      >
        <Badge
          shape="square"
          icon={size ? undefined : 'file-image-o'}
          img={size ? hyperfileUrl : undefined}
        />
      </ContentDragHandle>
      <TitleWithSubtitle
        title={title}
        subtitle={subtitle}
        hypermergeUrl={hypermergeUrl}
        editable={editable}
      />
    </ListItem>
  )
}

const supportsMimeType = (mimeType) => !!mimeType.match('image/')

ContentTypes.register({
  type: 'image',
  name: 'Image',
  icon: 'file-image-o',
  unlisted: true,
  contexts: {
    workspace: ImageContent,
    board: ImageContent,
    list: ImageInList,
    'title-bar': ImageInList,
  },
  supportsMimeType,
})
