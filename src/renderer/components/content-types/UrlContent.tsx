import React, { useEffect, useState, useCallback } from 'react'
import Unfluff from 'unfluff'
import Debug from 'debug'

import { Handle, HyperfileUrl } from 'hypermerge'
import * as Hyperfile from '../../hyperfile'
import ContentTypes from '../../ContentTypes'
import { ContentProps } from '../Content'
import { ChangeFn, useDocument } from '../../Hooks'
import { HypermergeUrl } from '../../ShareLink'

import newCss from './UrlContent.css'

const log = Debug('pushpin:url')

interface UrlData {
  title?: string
  image?: string
  description?: string
  canonicalLink?: string
}

interface UrlDoc {
  url?: string
  html?: string
  data?: UrlData | { error: string } // TODO: move error to top-level
  imageHyperfileUrl?: string
}

UrlContent.minWidth = 9
UrlContent.minHeight = 9
UrlContent.defaultWidth = 12
// UrlContent.defaultHeight = 18
UrlContent.maxWidth = 24
UrlContent.maxHeight = 32

export default function UrlContent(props: ContentProps) {
  const [urlInput, setUrl] = useState('')
  const [doc, changeDoc] = useRefreshedDocument(props.hypermergeUrl)
  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // TODO: we must stop propagation to prevent board from fullscreening :(
      e.stopPropagation()
      if (!doc) return
      window.open(doc.url, '_blank') // todo extract
    },
    [doc]
  )
  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUrl(e.target.value)
    },
    [setUrl]
  )
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation()

      if (e.key === 'Enter') {
        e.preventDefault()

        const url = urlInput.indexOf('://') === -1 ? `http://${urlInput}` : urlInput

        changeDoc((doc: UrlDoc) => {
          doc.url = url
        })
      }
    },
    [urlInput, changeDoc]
  )

  if (!doc) {
    return null
  }
  const { data, url } = doc

  if (!url) {
    return (
      <div style={css.urlCard}>
        <div style={css.inputGroup}>
          <i style={css.inputGroupIcon} className="fa fa-link" />
          <input
            autoFocus
            type="text"
            style={css.urlInput}
            value={urlInput}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder="Enter a URL..."
          />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={css.urlCard}>
        <p style={css.title}>Fetching...</p>
        <p style={css.link}>
          <a style={css.titleAnchor} href={url}>
            {url}
          </a>
        </p>
      </div>
    )
  }

  if ('error' in data) {
    return (
      <div style={css.urlCard}>
        <p style={css.error}>(URL did not load.)</p>
      </div>
    )
  }

  return (
    <div style={css.urlCard} onDoubleClick={onDoubleClick}>
      {doc.imageHyperfileUrl ? (
        <img style={css.img} src={doc.imageHyperfileUrl} alt={data.description} />
      ) : null}

      <p style={css.title}>
        <span style={css.titleAnchor}>{data.title}</span>
      </p>

      <p style={css.text}>{data.description}</p>
      <p style={css.link}>
        <span style={css.titleAnchor}>{data.canonicalLink || url}</span>
      </p>
    </div>
  )
}

function onPaste(e: React.ClipboardEvent) {
  e.stopPropagation()
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

  uploadImageUrl(image).then((hyperfileUrl) => {
    change((doc: UrlDoc) => {
      doc.imageHyperfileUrl = hyperfileUrl
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

function uploadImageUrl(url: string): Promise<HyperfileUrl> {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((buffer) => Hyperfile.writeBuffer(new Uint8Array(buffer)))
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

function create({ url, html }, handle: Handle<UrlDoc>, callback) {
  if (url) {
    handle.change((doc) => {
      doc.url = url
      doc.html = html
    })
  }
  callback()
}

function UrlFullscreenContent(props: ContentProps) {
  const [doc] = useDocument<UrlDoc>(props.hypermergeUrl)

  const onLoadIFrame = useCallback((event: React.SyntheticEvent<HTMLIFrameElement>) => {
    const obj = event.target as HTMLIFrameElement
    if (!obj || !obj.contentWindow) return
    obj.style.height = `${obj.contentWindow.document.body.scrollHeight}px`
  }, [])

  if (!doc || !doc.url || !doc.html) {
    return null
  }
  return (
    <div className={newCss.Fullscreen}>
      <iframe
        title="Embedded Content"
        frameBorder="0"
        className={newCss.Fullscreen_IFrame}
        srcDoc={doc.html}
        onLoad={onLoadIFrame}
      />
      <div className={newCss.Fullscreen_Banner}>{doc.url}</div>
    </div>
  )
}

ContentTypes.register({
  type: 'url',
  name: 'URL',
  icon: 'chain',
  contexts: {
    workspace: UrlFullscreenContent,
    board: UrlContent,
  },
  create,
})

// Should be { [name: string]: React.CSSProperties }
const css: any = {
  urlCard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    boxSizing: 'border-box',
    overflow: 'auto',
    position: 'relative',
    padding: 12,
    flex: '1 1 auto',
    border: '1px solid var(--colorPaleGrey)',
  },
  img: {
    WebkitUserDrag: 'none',
    height: '192px',
    display: 'block',
    objectFit: 'cover',
    marginBottom: 12,
    marginLeft: -12,
    marginTop: -12,
    marginRight: -12,
  },
  title: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '18px',
    lineHeight: '24px',
    color: 'black',
    textDecoration: 'none',
    marginBottom: 12,
    maxHeight: 72,
    overflowY: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 0,
  },
  titleAnchor: {
    WebkitUserDrag: 'none',
    color: 'inherit',
    textDecoration: 'none',
  },
  text: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '12px',
    lineHeight: '16px',
    color: '#637389',
    marginBottom: 12,
    flex: 1,
  },
  error: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '10px',
    lineHeight: 1.2,
    color: '#637389',
  },
  link: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '10px',
    lineHeight: 1.2,
    color: '#637389',
    justifySelf: 'flex-end',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 0,
  },
  urlInput: {
    backgroundColor: 'white',
    padding: '4px',
    height: 20,
    flex: 1,
    width: 'calc(100% -32px)',
  },
  inputGroup: {
    display: 'flex',
    flex: '1 0 auto',
    alignItems: 'center',
  },
  inputGroupIcon: {
    fontSize: 24,
    flex: 'none',
    color: '#637389',
  },
}
