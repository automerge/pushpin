import React from 'react'
import Debug from 'debug'
import * as Hyperfile from '../hyperfile'
import Content, { ContentProps } from './Content'
import ContentTypes from '../ContentTypes'
import { useDocument } from '../Hooks'
import { createDocumentLink } from '../ShareLink'

const log = Debug('pushpin:imagecontent')

interface ImageDoc {
  hyperfileUrl: string
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

function initializeDocument(image: ImageDoc, { hyperfileUrl }: Attrs) {
  image.hyperfileUrl = hyperfileUrl
}

/*
const createImageCardFromPath = (path, callback) => {
  Hyperfile.write(path)
    .then((hyperfileUrl) => {
      const contentUrl = Content.initializeContentDoc('image', { typeAttrs: { hyperfileUrl } })
      callback(contentUrl)
    })
    .catch((err) => {
      log(err)
    })
}
*/

function initializeContent(entry, callback) {
  const reader = new FileReader()

  reader.onload = () => {
    const buffer = Buffer.from(reader.result as ArrayBuffer)
    Hyperfile.writeBuffer(buffer)
      .then((hyperfileUrl) => {
        // XXX: obviously we shouldn't need to do this
        const contentUrl = Content.initializeContentDoc('image', { hyperfileUrl })
        callback(createDocumentLink('image', contentUrl))
      })
      .catch((err) => {
        log(err)
      })
  }

  reader.readAsArrayBuffer(entry)
}

ContentTypes.register({
  type: 'image',
  name: 'Image',
  icon: 'image',
  contexts: {
    workspace: ImageContent,
    board: ImageContent,
  },
  initializeDocument,
  initializeContent,
})
