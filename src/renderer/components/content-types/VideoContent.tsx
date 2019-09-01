import React from 'react'
import Debug from 'debug'

import { remote } from 'electron'
import { Handle } from 'hypermerge'
import * as Hyperfile from '../../hyperfile'
import { ContentProps } from '../Content'
import ContentTypes from '../../ContentTypes'
import { useDocument } from '../../Hooks'
import { VIDEO_DIALOG_OPTIONS } from '../../constants'
import './VideoContent.css'

const { dialog } = remote

const log = Debug('pushpin:videocontent')

export interface VideoDoc {
  hyperfileUrl: Hyperfile.HyperfileUrl
}

export default function VideoContent({ hypermergeUrl }: ContentProps) {
  const [doc] = useDocument<VideoDoc>(hypermergeUrl)

  if (!doc) {
    return null
  }
  if (!doc.hyperfileUrl) {
    return null
  }

  return (
    <div className="VideoContent">
      <video controls src={doc.hyperfileUrl} />
    </div>
  )
}

VideoContent.minWidth = 15
VideoContent.minHeight = 12
VideoContent.defaultWidth = 18

interface Attrs {
  hyperfileUrl: string
}

function createFromFile(entry: File, handle: Handle<VideoDoc>, callback) {
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

function create(attrs, handle: Handle<VideoDoc>, callback) {
  dialog.showOpenDialog(VIDEO_DIALOG_OPTIONS, (paths) => {
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

const supportsMimeType = (mimeType) => !!mimeType.match('video/')

ContentTypes.register({
  type: 'video',
  name: 'Video',
  icon: 'video',
  contexts: {
    workspace: VideoContent,
    board: VideoContent,
  },
  create,
  createFromFile,
  supportsMimeType,
})
