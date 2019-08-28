import React from 'react'
import Debug from 'debug'

import { remote } from 'electron'
import { Handle } from 'hypermerge'
import * as Hyperfile from '../../hyperfile'
import { ContentProps } from '../Content'
import ContentTypes from '../../ContentTypes'
import { useDocument } from '../../Hooks'
import { IMAGE_DIALOG_OPTIONS } from '../../constants'

const { dialog } = remote

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

const createNoAttrs = (handle, callback) => {
  dialog.showOpenDialog(IMAGE_DIALOG_OPTIONS, (paths) => {
    // User aborted.
    if (!paths) {
      return
    }
    if (paths.length !== 1) {
      throw new Error('Expected exactly one path?')
    }

    Hyperfile.write(paths[0])
      .then((hyperfileUrl) => {
        handle.change((doc) => {
          doc.hyperfileUrl = hyperfileUrl
        })

        callback()
      })
      .catch((err) => {
        log(err)
      })
  })
}

function createFromFile(entry: File, handle: Handle<ImageDoc>, callback) {
  const reader = new FileReader()

  reader.onload = () => {
    const buffer = Buffer.from(reader.result as ArrayBuffer)
    Hyperfile.writeBuffer(buffer)
      .then((hyperfileUrl) => {
        handle.change((doc) => {
          doc.hyperfileUrl = hyperfileUrl
        })
        callback()
      })
      .catch((err) => {
        log(err)
      })
  }

  reader.readAsArrayBuffer(entry)
}

function create({ file }, handle: Handle<ImageDoc>, callback) {
  if (file) {
    createFromFile(file, handle, callback)
  } else {
    createNoAttrs(handle, callback)
  }
}

ContentTypes.register({
  type: 'image',
  name: 'Image',
  icon: 'image',
  contexts: {
    workspace: ImageContent,
    board: ImageContent,
  },
  create,
})
