import React, { useCallback, useEffect, useRef, useMemo } from 'react'

import Automerge from 'automerge'
import Quill, { TextChangeHandler, QuillOptionsStatic } from 'quill'
import Delta from 'quill-delta'
import ContentTypes from '../ContentTypes'
import { ContentProps } from './Content'
import { useDocument } from '../Hooks'
import './QuillContent.css'
// import '../../../node_modules/quill/dist/quill.core.css'
// import '../../../node_modules/quill/dist/quill.snow.css'

interface QuillDoc {
  text: Automerge.Text
}

QuillContent.minWidth = 6
QuillContent.minHeight = 2
QuillContent.defaultWidth = 12
QuillContent.defaultHeight = 8

export default function QuillContent(props: ContentProps) {
  const [doc, changeDoc] = useDocument<QuillDoc>(props.hypermergeUrl)

  const ref = useQuill(
    doc && doc.text,
    (fn) => {
      changeDoc((doc) => fn(doc.text))
    },
    {
      // theme: 'snow',
      placeholder: 'Type something...',
      formats: [],
      modules: {
        toolbar: false,
      },
    }
  )

  return <div className="QuillContent" ref={ref} />
}

function useQuill(
  text: Automerge.Text | null,
  changeFn: (cb: (text: Automerge.Text) => void) => void,
  options?: QuillOptionsStatic
): React.Ref<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null)
  const quill = useRef<Quill | null>(null)
  const textString = useMemo(() => text && text.join(''), [text])
  const makeChange = useStaticCallback(changeFn)

  useEffect(() => {
    if (!ref.current) {
      return () => {}
    }

    const q = new Quill(ref.current, options)
    quill.current = q

    if (textString) q.setText(textString)

    const onChange: TextChangeHandler = (changeDelta, _oldContents, source) => {
      if (source !== 'user') return

      makeChange((content) => applyDeltaToText(content, changeDelta))
    }

    q.on('text-change', onChange)

    return () => {
      quill.current = null
      q.off('text-change', onChange)
      // TODO: destroy quill instance
    }
  }, [ref.current])

  useEffect(() => {
    if (!textString || !quill.current) return
    if (textString === quill.current.getText()) return

    quill.current.setText(textString)
  }, [textString])

  return ref
}

function useStaticCallback<T extends (...args: any[]) => any>(callback: T): T {
  const cb = useRef<T>(callback)
  cb.current = callback

  return useCallback((...args: any[]) => cb.current(...args), []) as T
}

function applyDeltaToText(text: Automerge.Text, delta: Delta): void {
  let i = 0
  delta.forEach((op, idx) => {
    if (op.retain) {
      i += op.retain
    }

    if (typeof op.insert === 'string') {
      const chars = op.insert.split('')
      text.splice(i, 0, ...chars)
      i += chars.length
    } else if (op.delete) {
      text.splice(i, op.delete)
    }
  })
}

function initializeDocument(doc: QuillDoc) {
  doc.text = new Automerge.Text()
  doc.text.insertAt(0, '\n')
}

ContentTypes.register({
  name: 'Quill Text',
  type: 'quill',
  icon: 'newspaper',
  initializeDocument,
  contexts: {
    board: QuillContent,
    workspace: QuillContent,
  },
})
