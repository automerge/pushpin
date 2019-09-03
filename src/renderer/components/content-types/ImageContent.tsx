import React from 'react'
import Debug from 'debug'

import { remote } from 'electron'
import { Handle } from 'hypermerge'
import * as Hyperfile from '../../hyperfile'
import { ContentProps } from '../Content'
import ContentTypes from '../../ContentTypes'
import { useDocument } from '../../Hooks'

const { dialog } = remote

const log = Debug('pushpin:imagecontent')

export interface ImageDoc {
  hyperfileUrl: Hyperfile.HyperfileUrl
}

export default function ImageContent({ hypermergeUrl }: ContentProps) {
  const [doc] = useDocument<ImageDoc>(hypermergeUrl)

  if (!doc) {
    return null
  }
  if (!doc.hyperfileUrl) {
    return null
  }

  return <img className="Image" alt="" src={doc.hyperfileUrl} />
}

ImageContent.minWidth = 3
ImageContent.minHeight = 3
ImageContent.defaultWidth = 18

interface Attrs {
  hyperfileUrl: string
}

const supportsMimeType = (mimeType) => !!mimeType.match('image/')

ContentTypes.register({
  type: 'image',
  name: 'Image',
  icon: 'image',
  contexts: {
    workspace: ImageContent,
    board: ImageContent,
  },
  supportsMimeType,
})
