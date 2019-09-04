import React from 'react'
import { FileDoc } from '.'

import { ContentProps } from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { useDocument } from '../../../Hooks'
import './AudioContent.css'

export default function AudioContent({ hypermergeUrl }: ContentProps) {
  const [doc] = useDocument<FileDoc>(hypermergeUrl)

  if (!(doc && doc.hyperfileUrl)) {
    return null
  }
  return (
    <div className="AudioContent">
      <audio controls src={doc.hyperfileUrl} />
    </div>
  )
}

const supportsMimeType = (mimeType) => !!mimeType.match('audio/')

ContentTypes.register({
  type: 'audio',
  name: 'Audio',
  icon: 'file-audio-o',
  unlisted: true,
  contexts: {
    workspace: AudioContent,
    board: AudioContent,
  },
  supportsMimeType,
})
