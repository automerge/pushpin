import React from 'react'

import { ContentProps } from './Content'
import ContentTypes from '../ContentTypes'
import { useDocument } from '../Hooks';

interface ImageDoc {
  hyperfileUrl: string
}

export default function ImageContent({ hypermergeUrl }: ContentProps) {
  const [doc] = useDocument<ImageDoc>(hypermergeUrl)

  if (!doc) return null
  if (!doc.hyperfileUrl) return null

  return <img className="image" alt="" src={doc.hyperfileUrl} />
}

ImageContent.minWidth = 3
ImageContent.minHeight = 3
ImageContent.defaultWidth = 18

interface Attrs {
  hyperfileUrl: string
}

function initializeDocument(image: ImageDoc, { hyperfileUrl }: Attrs) {
  image.hyperfileUrl = hyperfileUrl
}

ContentTypes.register({
  type: 'image',
  name: 'Image',
  icon: 'image',
  contexts: {
    workspace: ImageContent,
    board: ImageContent
  },
  initializeDocument: initializeDocument
})
