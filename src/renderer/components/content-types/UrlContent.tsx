import * as path from 'path'
import React, { useEffect, useState } from 'react'
import Unfluff from 'unfluff'
import Debug from 'debug'
import { IpcMessageEvent } from 'electron'

import { Handle, HyperfileUrl } from 'hypermerge'
import { Header } from 'hypermerge/dist/FileStore'
import * as Hyperfile from '../../hyperfile'
import ContentTypes from '../../ContentTypes'
import { ContentProps } from '../Content'
import { ChangeFn, useDocument, useEvent } from '../../Hooks'
import { HypermergeUrl } from '../../ShareLink'
import './UrlContent.css'
import SecondaryText from '../SecondaryText'
import Badge from '../Badge'
import Heading from '../Heading'
import { toNodeReadable } from '../../../NodeReadable'
import { APP_PATH } from '../../constants'

const log = Debug('pushpin:url')

interface UrlData {
  title?: string
  image?: string
  description?: string
  canonicalLink?: string
}

interface UrlDoc {
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
  const [doc, changeDoc] = useRefreshedDocument(props.hypermergeUrl)
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
    console.log('dom-ready', webview)
    webview && (webview as any).send('freeze-dry', { type: 'Ready' })
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
    })
  }
  const { data, url, htmlHyperfileUrl, capturedAt } = doc

  console.log({ htmlHyperfileUrl })

  if (!data) {
    return (
      <div className="UrlCard">
        <p className="UrlCard-title">Fetching...</p>
        <p className="UrlCard-link">
          <a className="UrlCard-titleAnchor" href={url}>
            {url}
          </a>
        </p>
      </div>
    )
  }

  if ('error' in data) {
    return (
      <div className="UrlCard">
        <p className="UrlCard-error">(URL did not load.)</p>
        <p className="UrlCard-link">
          <a className="UrlCard-titleAnchor" href={url}>
            {url}
          </a>
        </p>
      </div>
    )
  }

  if (props.context === 'workspace') {
    return (
      <div className="UrlCardWorkspace">
        <div className="UrlCard UrlCard--workspace">
          <div>{capturedAt}</div>
          {htmlHyperfileUrl ? (
            <iframe frameBorder="0" title={data.title} src={htmlHyperfileUrl} />
          ) : (
            <webview
              ref={setWebview}
              className="UrlCard-webview"
              title={data.title}
              src={data.canonicalLink || url}
              preload={`file://${path.resolve(APP_PATH, 'dist/freeze-dry-preload.js')}`}
            />
          )}
        </div>
        <div>
          <a
            className="UrlCard-iconLink"
            title="Open in browser..."
            href={data.canonicalLink || url}
          >
            <i className="fa fa-external-link" />
          </a>
          {htmlHyperfileUrl ? (
            <a className="UrlCard-iconLink" title="Refresh" href="#" onClick={refreshContent}>
              <i className="fa fa-refresh" />
            </a>
          ) : null}
        </div>
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
    </div>
  )
}

function useRefreshedDocument(url: HypermergeUrl): [null | UrlDoc, ChangeFn<UrlDoc>] {
  const [doc, change] = useDocument<UrlDoc>(url)

  useEffect(() => {
    if (doc) {
      refreshContent(doc, change)
    }
  }, [doc && doc.url])

  useEffect(() => {
    if (doc) {
      refreshImageContent(doc, change)
    }
  }, [doc && doc.data])

  return [doc, change]
}

function refreshContent(doc: UrlDoc, change: ChangeFn<UrlDoc>) {
  if (!doc.url || doc.data) {
    return
  }

  unfluffUrl(doc.url)
    .then((data) => {
      change((doc: UrlDoc) => {
        removeEmpty(data)
        doc.data = data
      })
    })
    .catch((reason) => {
      log('refreshContent.caught', reason)
      change((doc: UrlDoc) => {
        doc.data = { error: reason }
      })
    })
}

function refreshImageContent(doc: UrlDoc, change: ChangeFn<UrlDoc>) {
  if (doc.imageHyperfileUrl) {
    return
  }

  if (!doc.data || !('image' in doc.data)) {
    return
  }

  const { image } = doc.data

  if (!image) {
    return
  }

  importImageUrl(image).then(({ url }: Header) => {
    change((doc: UrlDoc) => {
      doc.imageHyperfileUrl = url
    })
  })
}

function unfluffUrl(url: string): Promise<UrlData> {
  return fetch(url)
    .then((response) => response.text())
    .then<UrlData>(Unfluff)
    .then((data) => {
      removeEmpty(data)

      if (data.image) {
        data.image = new URL(data.image, url).toString()
      }

      return data
    })
}

function importImageUrl(url: string): Promise<Header> {
  return fetch(url).then((response) => {
    if (!response.body) {
      throw new Error('image fetch failed')
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    return Hyperfile.write(toNodeReadable(response.body), contentType)
  })
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

function create({ url }, handle: Handle<UrlDoc>, callback) {
  handle.change((doc) => {
    doc.url = url
  })
  callback()
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
  unlisted: true,
})
