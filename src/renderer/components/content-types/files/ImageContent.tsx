/* eslint-disable jsx-a11y/alt-text */
/* our unfluff images don't have meaningful alt-text aside from the title */
import React, { useRef } from 'react'
import { FileDoc } from '.'

import { ContentProps } from '../../Content'
import * as ContentTypes from '../../../ContentTypes'
import { useDocument, useHyperfileHeader } from '../../../Hooks'
import Badge from '../../Badge'
import TitleEditor from '../../TitleEditor'
import SecondaryText from '../../SecondaryText'

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

  return (
    <div className="UrlListItem">
      <span draggable onDragStart={onDragStart}>
        <Badge shape="square" icon="file-image-o" />
      </span>
      {hyperfileUrl ? <img className="UrlListItem-icon" src={hyperfileUrl} /> : null}

      <div className="UrlListItem-title">
        {editable ? <TitleEditor url={hypermergeUrl} /> : <div className="Heading">{title}</div>}
        <SecondaryText>Put image details here</SecondaryText>
      </div>
    </div>
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
  },
  supportsMimeType,
})
