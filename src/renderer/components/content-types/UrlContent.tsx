/* eslint-disable jsx-a11y/alt-text */
/* our unfluff images don't have meaningful alt-text aside from the title */
import * as path from 'path'
import React, { useState } from 'react'
import Unfluff from 'unfluff'
import { IpcMessageEvent } from 'electron'

import { Handle, HyperfileUrl } from 'hypermerge'
import * as Hyperfile from '../../hyperfile'
import * as ContentTypes from '../../ContentTypes'
import { ContentProps } from '../Content'
import { ChangeFn, useDocument, useEvent } from '../../Hooks'
import './UrlContent.css'
import Badge from '../Badge'
import { APP_PATH } from '../../constants'
import * as ContentData from '../../ContentData'
import * as WebStreamLogic from '../../../WebStreamLogic'
import ContentDragHandle from '../ContentDragHandle'
import TitleWithSubtitle from '../TitleWithSubtitle'
import ListItem from '../ListItem'

interface UrlData {
  title?: string
  image?: string
  description?: string
  canonicalLink?: string
}

interface UrlDoc {
  title: string
  url: string
  data?: UrlData
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

/**
 * UrlContent -- preserves and unfluffs a URL for posterity
 *
 * URL content can arrive pre-cooked from the browser via the web clipper, or through pasting a
 * URL into the application in which case we want to fetch that content.
 *
 * We use a hidden webview combined with the NPM freeze-dry library to snapshot it.
 * Once downloaded, the content is stored as a single big string in a hyperfile, and any metadata
 * we can successfully extract from node-unfluff is preserved as well.
 *
 * On the whole this is a fragile process: things can 500, or go away, and we don't account for
 * recovering from failed refreshes or other things that can go wrong along the way.
 *
 * There's also a ton of metadata in node-unfluff we're not using yet, but we are paying the
 * storage cost for.
 */
export default function UrlContent(props: ContentProps) {
  const [doc, changeDoc] = useDocument<UrlDoc>(props.hypermergeUrl)
  const [webview, setWebview] = useState<HTMLWebViewElement | null>(null)

  /*
   * freeze-dry helpers
   */
  useEvent(webview, 'dom-ready', () => {
    console.log('dom-ready', webview) // eslint-disable-line
    doc &&
      !doc.htmlHyperfileUrl &&
      webview &&
      (webview as any).send('freeze-dry', { type: 'Ready' })
  })

  useEvent(webview, 'ipc-message', ({ channel, args }: IpcMessageEvent) => {
    if (channel !== 'freeze-dry') return

    const [hyperfileUrl] = args as [HyperfileUrl]
    changeDoc((doc) => {
      doc.htmlHyperfileUrl = hyperfileUrl
      doc.capturedAt = new Date().toISOString()
      unfluffContent(doc, changeDoc)
    })
  })

  useEvent(webview, 'console-message', ({ message }: { message: string }) => {
    console.log('webview.log:', message) // eslint-disable-line
  })
  /*
   * end freeze-dry helpers
   */

  if (!doc) {
    return null
  }

  const { data, title, url, htmlHyperfileUrl, capturedAt } = doc
  const resolvedUrl = data && data.canonicalLink ? data.canonicalLink : url
  const description = data && data.description ? data.description : ''

  /* clearing content causes the hidden webview to be rendered, which will eventually kick off
   * a freeze-dry and subsequent unfluffing
   */
  function clearContent() {
    changeDoc((doc) => {
      delete doc.htmlHyperfileUrl
      delete doc.capturedAt
      delete doc.data
    })
  }

  // if we have no hyperfile, that means we should render an invisible webview
  // which will give us a callback at dom-ready to request a freeze-drying
  // we always secretly embed this if we don't have a hyperfile for this URL already.
  // a more robust solution would have some kind of registry of URLs to avoid
  // requesting the same thing over and over.
  const hiddenWebView = doc.htmlHyperfileUrl ? null : (
    <webview
      ref={setWebview}
      className="UrlCard-hiddenWebview"
      src={resolvedUrl}
      preload={`file://${path.resolve(APP_PATH, 'dist/freeze-dry-preload.js')}`}
    />
  )

  const renderWorkspace = () => (
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
        <a className="UrlCard-iconLink" title="Open in browser..." href={resolvedUrl}>
          <i className="fa fa-external-link" />
        </a>

        <a className="UrlCard-iconLink" title="Capture Again" href="#" onClick={clearContent}>
          <i className="fa fa-refresh" />
        </a>
      </div>
      {hiddenWebView}
    </div>
  )

  const renderCard = () => (
    <div className="UrlCard">
      {doc.imageHyperfileUrl ? <img className="UrlCard-img" src={doc.imageHyperfileUrl} /> : null}
      <p className="UrlCard-title">
        <span className="titleAnchor">{title}</span>
      </p>
      {description ? <p className="UrlCard-text">{description}</p> : null}
      <p className="UrlCard-link">
        <span className="UrlCard-titleAnchor">
          <a href={resolvedUrl}>{resolvedUrl}</a>
        </span>
      </p>
      {hiddenWebView}
    </div>
  )

  // xxx this was <a> resolvedURL a second ago
  const subtitle = resolvedUrl
  const { url: pushpinUrl, hypermergeUrl } = props
  const renderList = () => (
    <ListItem>
      <ContentDragHandle url={pushpinUrl}>
        <Badge
          shape="square"
          icon={doc.imageHyperfileUrl ? undefined : 'chain'}
          img={doc.imageHyperfileUrl}
        />
      </ContentDragHandle>
      <TitleWithSubtitle
        title={title}
        subtitle={subtitle}
        href={resolvedUrl} // gross
        hypermergeUrl={hypermergeUrl}
      />
    </ListItem>
  )

  switch (props.context) {
    case 'list':
      return renderList()
    case 'board':
      return renderCard()
    case 'workspace':
      return renderWorkspace()
    default:
      return renderCard()
  }
}

async function unfluffContent(doc: UrlDoc, change: ChangeFn<UrlDoc>) {
  if (!doc.htmlHyperfileUrl) throw new Error("can't unfluff without content")
  const [, /* header */ content] = await Hyperfile.fetch(doc.htmlHyperfileUrl)
  const html = await Hyperfile.streamToBuffer(content)
  const data = await Unfluff(html)

  // when we wrote this, hypermerge would crash if you sent it undefined values
  // which you can sometimes get back from unfluff if it doesn't find a more useful response
  removeEmpty(data)

  change((doc: UrlDoc) => {
    doc.data = data
    if (data.title) {
      doc.title = data.title
    }
    if (data.image) {
      fetchImageContent(doc, change)
    }
  })
}

async function fetchImageContent(doc: UrlDoc, change: ChangeFn<UrlDoc>) {
  if (!(doc && doc.data && doc.data.image)) throw new Error("can't fetch without an image")

  // images here are often relative URLs which fail when we fetch them below
  const resolvedImage = new URL(doc.data.image, doc.url).toString()
  const response = await fetch(resolvedImage)

  if (!response.body) {
    throw new Error('image fetch failed')
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const hyperfile = await Hyperfile.write(response.body, contentType)

  change((doc: UrlDoc) => {
    doc.imageHyperfileUrl = hyperfile.url
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
  const { capturedAt } = contentData
  // Yikes. We need to decode the encoded html. This needs to be rethought to be more
  // ergonomic.
  const { url } = await Hyperfile.write(
    contentData.data
      .pipeThrough(new window.TextDecoderStream())
      .pipeThrough(new WebStreamLogic.DecodeUriComponentStream()),
    contentData.mimeType
  )

  create({ url: contentData.src!, hyperfileUrl: url, capturedAt }, handle)
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
    // do nothing; this will automatically populate when the component renders
  }
}

ContentTypes.register({
  type: 'url',
  name: 'URL',
  icon: 'chain',
  contexts: {
    workspace: UrlContent,
    board: UrlContent,
    list: UrlContent,
  },
  create,
  createFrom,
  unlisted: true,
})
