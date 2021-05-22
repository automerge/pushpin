import React, { useEffect, useRef } from 'react'
import { Handle } from 'hypermerge'

import * as Observable from '@observablehq/inspector'
import * as ContentTypes from '../../ContentTypes'
import { ContentProps } from '../Content'
import { HypermergeUrl, parts } from '../../ShareLink'
import { useDocument } from '../../Hooks'
import Badge from '../Badge'
import TitleEditor from '../TitleEditor'
import * as ContentData from '../../ContentData'
// import '@observablehq/inspector/src/style.css'
import './Inspector.css'

interface InspectorDoc {
  targetURL: HypermergeUrl
}

interface Props extends ContentProps {
  uniquelySelected?: boolean
}

interface InspectorOpts {
  targetURL: HypermergeUrl | null
  change: (cb: (doc: InspectorDoc) => void) => void
}

Inspector.minWidth = 6
Inspector.minHeight = 2
Inspector.defaultWidth = 12
Inspector.defaultHeight = 18

const decodeTargetURL = (url: string) => {
  try {
    const { scheme, docId } = parts(url)
    if (scheme !== 'hypermerge') {
      throw new Error(`Invalid url scheme: ${scheme} (expected hypermerge)`)
    }

    if (!docId) {
      throw new Error(`Missing docId in ${url}`)
    }

    return `hypermerge:/${docId}` as HypermergeUrl
  } catch (_) {
    return null
  }
}

export default function Inspector<d>(props: Props) {
  const [doc, changeDoc] = useDocument<InspectorDoc>(props.hypermergeUrl)
  const targetURL = doc && decodeTargetURL(doc.targetURL)

  const [ref] = useInspector({
    targetURL,
    change(fn: (doc: InspectorDoc) => void) {
      changeDoc((doc) => fn(doc))
    },
  })
  const placeholder = `URL of the document to inspect e.g ${props.hypermergeUrl}`

  return (
    <div className="Inspector" onPaste={stopPropagation}>
      <TitleEditor field="targetURL" url={props.hypermergeUrl} placeholder={placeholder} />
      <div ref={ref} />
    </div>
  )
}

function useInspector<d>({
  targetURL,
  change,
}: InspectorOpts): [React.Ref<HTMLDivElement>, Observable.Inspector | null] {
  const ref = useRef<HTMLDivElement>(null)
  const inspector = useRef<Observable.Inspector | null>(null)
  const [targetDoc] = useDocument(targetURL)
  // const makeChange = useStaticCallback(change)

  useEffect(() => {
    if (!ref.current) return () => {}

    const container = ref.current
    inspector.current = new Observable.Inspector(container)
    inspector.current.pending()

    return () => {
      // inspector.current = null
      container.textContent = ''

      inspector.current = new Observable.Inspector(container)
      inspector.current.pending()
    }
  }, [ref.current]) // eslint-disable-line

  useEffect(() => {
    if (!inspector.current) return () => {}

    if (targetDoc) {
      inspector.current.fulfilled(targetDoc)
    }

    return () => {
      if (ref.current) {
        ref.current.textContent = ''
      }
    }
  }, [targetDoc, targetURL])

  return [ref, inspector.current]
}

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
}

async function createFrom(contentData: ContentData.ContentData, handle: Handle<InspectorDoc>) {
  handle.change((doc) => {})
}

function create({ text }, handle: Handle<InspectorDoc>) {
  handle.change((doc) => {})
}

function InspectorInList(props: ContentProps) {
  const [doc] = useDocument<InspectorDoc>(props.hypermergeUrl)
  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', props.url)
  }

  if (!doc) return null

  return (
    <div className="DocLink">
      <span draggable onDragStart={onDragStart}>
        <Badge icon="sticky-note" />
      </span>
      <TitleEditor
        field="targetURL"
        url={props.hypermergeUrl}
        placeholder="URL of the document to inpsect"
      />
    </div>
  )
}

const supportsMimeType = (mimeType) => true

ContentTypes.register({
  type: 'inspect',
  name: 'Inspector',
  icon: 'cogs',
  contexts: {
    board: Inspector,
    workspace: Inspector,
    list: InspectorInList,
  },
  create,
  createFrom,
  supportsMimeType,
})
