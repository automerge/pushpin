import * as path from 'path'
import React, { useState } from 'react'
import Unfluff from 'unfluff'
import Debug from 'debug'
import { IpcMessageEvent } from 'electron'

import { Handle, HyperfileUrl } from 'hypermerge'
import * as Hyperfile from '../../hyperfile'
import ContentTypes from '../../ContentTypes'
import { ContentProps } from '../Content'
import { ChangeFn, useDocument, useEvent } from '../../Hooks'
import './UrlContent.css'
import SecondaryText from '../SecondaryText'
import Badge from '../Badge'
import Heading from '../Heading'
import { APP_PATH } from '../../constants'
import * as ContentData from '../../ContentData'

const log = Debug('pushpin:url')

interface UrlData {
  title?: string
  image?: string
  description?: string
  canonicalLink?: string
}

interface UrlDoc {
  title: string
  url: string
  data?: UrlData | { error: string } // TODO: move error to top-level
  htmlHyperfileUrl?: HyperfileUrl
  imageHyperfileUrl?: HyperfileUrl
  capturedAt?: string
}

UrlContent.minWidth = 9
UrlContent.minHeight = 9
UrlContent.defaultWidth = 12
// UrlContent.defaultHeight = 18
UrlContent.maxWidth = 24
UrlContent.maxHeight = 32

export default function UrlContent(props: ContentProps) {
  const [doc, changeDoc] = useDocument<UrlDoc>(props.hypermergeUrl)
  const [webview, setWebview] = useState<HTMLWebViewElement | null>(null)

  useEvent(webview, 'ipc-message', ({ channel, args }: IpcMessageEvent) => {
    if (channel !== 'freeze-dry') return

    const [hyperfileUrl] = args as [HyperfileUrl]
    changeDoc((doc) => {
      doc.htmlHyperfileUrl = hyperfileUrl
      doc.capturedAt = new Date().toISOString()
    })
  })

  useEvent(webview, 'dom-ready', () => {
    console.log('dom-ready', webview) // eslint-disable-line
    doc &&
      !doc.htmlHyperfileUrl &&
      webview &&
      (webview as any).send('freeze-dry', { type: 'Ready' })
  })

  useEvent(webview, 'console-message', ({ message }: { message: string }) => {
    console.log('webview.log:', message) // eslint-disable-line
  })

  if (!doc) {
    return null
  }

  function refreshContent() {
    changeDoc((doc) => {
      delete doc.htmlHyperfileUrl
      delete doc.capturedAt
      delete doc.data
    })

    if (!doc || !doc.url || !changeDoc) {
      return
    }

    fetchContent(doc, changeDoc).catch((reason) => {
      log('refreshContent.caught', reason)
      changeDoc((doc: UrlDoc) => {
        doc.data = { error: reason }
      })
    })
  }
  const { data, title, url, htmlHyperfileUrl, capturedAt } = doc

  const hiddenWebView = doc.htmlHyperfileUrl ? (
    <webview
      ref={setWebview}
      className="UrlCard-hiddenWebview"
      preload={`file://${path.resolve(APP_PATH, 'dist/freeze-dry-preload.js')}`}
    />
  ) : null

  if (!data) {
    return (
      <div className="UrlCard">
        <p className="UrlCard-title">Fetching...</p>
        <p className="UrlCard-link">
          <a className="UrlCard-titleAnchor" href={url}>
            {url}
          </a>
        </p>
        {hiddenWebView}
      </div>
    )
  }

  if ('error' in data) {
    return (
      <div className="UrlCard">
        <p className="UrlCard-error">(URL did not load.)</p>
        <p>{JSON.stringify(data.error)}</p>
        <p className="UrlCard-link">
          <a className="UrlCard-titleAnchor" href={url}>
            {url}
          </a>

          <a className="UrlCard-iconLink" title="Capture Again" href="#" onClick={refreshContent}>
            <i className="fa fa-refresh" />
          </a>
        </p>
        {hiddenWebView}
      </div>
    )
  }

  if (props.context === 'workspace') {
    return (
      <div className="UrlCardWorkspace">
        <div className="UrlCard-info">
          {capturedAt ? (
            <span>
              Captured:{' '}
              {new Date(capturedAt).toLocaleString(undefined, {
                dateStyle: 'long',
                timeStyle: 'short',
              } as any)}
            </span>
          ) : null}
        </div>
        <div className="UrlCard UrlCard--workspace">
          {htmlHyperfileUrl ? (
            <webview className="UrlCard-webview" title={title} src={htmlHyperfileUrl} />
          ) : (
            <div className="UrlCard-loading">Loading...</div>
          )}
        </div>
        <div className="UrlCard-buttons">
          <a
            className="UrlCard-iconLink"
            title="Open in browser..."
            href={data.canonicalLink || url}
          >
            <i className="fa fa-external-link" />
          </a>

          <a className="UrlCard-iconLink" title="Capture Again" href="#" onClick={refreshContent}>
            <i className="fa fa-refresh" />
          </a>
        </div>
        {hiddenWebView}
      </div>
    )
  }

  return (
    <div className="UrlCard">
      {doc.imageHyperfileUrl ? (
        <img className="UrlCard-img" src={doc.imageHyperfileUrl} alt={data.description} />
      ) : null}

      <p className="UrlCard-title">
        <span className="titleAnchor">{data.title}</span>
      </p>

      <p className="UrlCard-text">{data.description}</p>
      <p className="UrlCard-link">
        <span className="UrlCard-titleAnchor">
          <a href={data.canonicalLink || url}>{data.canonicalLink || url}</a>
        </span>
      </p>
      {hiddenWebView}
    </div>
  )
}

async function fetchContent(doc: UrlDoc, change: ChangeFn<UrlDoc>) {
  const response = await fetch(doc.url)
  if (!response.body) throw new Error('no response from fetch')

  const headers = await Hyperfile.write(
    response.body,
    response.headers.get('content-type') || 'text/html'
  )

  change((doc: UrlDoc) => {
    doc.htmlHyperfileUrl = headers.url
    unfluffContent(doc, change)
  })
}

async function unfluffContent(doc: UrlDoc, change: ChangeFn<UrlDoc>) {
  if (!doc.htmlHyperfileUrl) throw new Error("can't unfluff without content")
  const [, /* header */ content] = await Hyperfile.fetch(doc.htmlHyperfileUrl)
  const data = await Unfluff(content)

  removeEmpty(data)

  if (data.image) {
    data.image = new URL(data.image, doc.url).toString()
  }

  change((doc: UrlDoc) => {
    doc.data = data
    if (data.image) {
      fetchImageContent(doc, change)
    }
  })
}

async function fetchImageContent(doc: UrlDoc, change: ChangeFn<UrlDoc>) {
  if (!(doc && doc.data && !('error' in doc.data) && doc.data.image))
    throw new Error("can't fetch no image")

  const response = await fetch(doc.data.image)

  if (!response.body) {
    throw new Error('image fetch failed')
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'

  const header = await Hyperfile.write(response.body, contentType)

  change((doc: UrlDoc) => {
    doc.imageHyperfileUrl = header.url
  })

  /* and we're finished! */
}

function removeEmpty(obj: object) {
  Object.entries(obj).forEach(([key, val]) => {
    if (val && typeof val === 'object') {
      removeEmpty(val)
    } else if (val == null) {
      delete obj[key]
    }
  })
}

/**
 * Assumes we are creating from a content data object with mimetype equal to 'text/html'.
 * This function should also probably handle a mimeType equal to 'text/uri-list'.
 */
async function createFrom(contentData: ContentData.ContentData, handle: Handle<UrlDoc>) {
  // Yikes. We need to decode the encoded html. This needs to be rethought to be more
  // ergonomic.
  const { url } = await Hyperfile.write(
    contentData.data.pipeThrough(
      new window.TransformStream({
        start() {},
        transform(chunk, controller) {
          controller.enqueue(decodeURIComponent(chunk))
        },
      })
    ),
    contentData.mimeType
  )

  create({ url: contentData.src!, hyperfileUrl: url, capturedAt: Date.now() }, handle)
}

function create({ url, hyperfileUrl, capturedAt }, handle: Handle<UrlDoc>) {
  handle.change((doc) => {
    doc.url = url
    if (hyperfileUrl) {
      doc.htmlHyperfileUrl = hyperfileUrl
    }
    if (capturedAt) {
      doc.capturedAt = capturedAt
    }
  })

  if (!handle.state) {
    throw new Error('no handle.state available during change')
  }

  if (hyperfileUrl) {
    unfluffContent(handle.state, handle.change)
  } else {
    fetchContent(handle.state, handle.change)
  }
}

function UrlContentInList(props: ContentProps) {
  const [doc] = useDocument<UrlDoc>(props.hypermergeUrl)
  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', props.url)
  }

  if (!doc) return null

  const { data, url } = doc

  return (
    <div className="UrlListItem">
      <span draggable onDragStart={onDragStart}>
        <Badge icon="chain" />
      </span>
      {doc.imageHyperfileUrl ? (
        <img
          className="UrlListItem-icon"
          src={doc.imageHyperfileUrl}
          alt={data && !('error' in data) ? data.description : ''}
        />
      ) : null}

      <div className="UrlListItem-title">
        {data && !('error' in data) && data.title ? (
          <>
            <Heading>{data.title}</Heading>
            <SecondaryText>
              <a href={data.canonicalLink || url}>{data.canonicalLink || url}</a>
            </SecondaryText>
          </>
        ) : (
          <Heading>{url}</Heading>
        )}
      </div>
    </div>
  )
}

ContentTypes.register({
  type: 'url',
  name: 'URL',
  icon: 'chain',
  contexts: {
    workspace: UrlContent,
    board: UrlContent,
    list: UrlContentInList,
  },
  create,
  createFrom,
  unlisted: true,
})
