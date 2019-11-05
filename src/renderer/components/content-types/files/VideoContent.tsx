import React from 'react'

import { FileDoc } from '.'
import { ContentProps } from '../../Content'
import * as ContentTypes from '../../../ContentTypes'
import { useDocument } from '../../../Hooks'
import './VideoContent.css'

export default function VideoContent({ hypermergeUrl }: ContentProps) {
  const [doc] = useDocument<FileDoc>(hypermergeUrl)

  if (!(doc && doc.hyperfileUrl)) {
    return null
  }

  return (
    <div className="VideoContent">
      <video controls src={doc.hyperfileUrl} />
    </div>
  )
}

const supportsMimeType = (mimeType) => !!mimeType.match('video/')

ContentTypes.register({
  type: 'video',
  name: 'Video',
  icon: 'file-video-o',
  unlisted: true,
  contexts: {
    workspace: VideoContent,
    board: VideoContent,
  },
  supportsMimeType,
})
