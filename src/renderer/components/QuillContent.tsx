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

interface TextDoc {
  text: Automerge.Text
}

TextContent.minWidth = 6
TextContent.minHeight = 2
TextContent.defaultWidth = 12
TextContent.defaultHeight = 8

export default function TextContent(props: ContentProps) {
  const [doc, changeDoc] = useDocument<TextDoc>(props.hypermergeUrl)

  const [ref, quill] = useQuill(
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

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Backspace' || !doc) {
        e.stopPropagation()
        return
      }
      // const text = doc.text.join('')

      if (!quill) return

      const text = quill.getText()

      console.log('text', JSON.stringify(text))

      // we normally prevent deletion by stopping event propagation
      // but if the card is already empty and we hit delete, allow it

      // const text = quill.getText()

      if (text !== '' && text !== '\n') {
        e.stopPropagation()
      }
    },
    [quill]
  )

  return <div className="QuillContent" ref={ref} onKeyDown={onKeyDown} />
}

function useQuill(
  text: Automerge.Text | null,
  changeFn: (cb: (text: Automerge.Text) => void) => void,
  options?: QuillOptionsStatic
): [React.Ref<HTMLDivElement>, Quill | null] {
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
      // TODO: destroy quill instance?
    }
  }, [ref.current])

  useEffect(() => {
    if (!textString || !quill.current) return

    const delta = new Delta().insert(textString)
    const diff = quill.current.getContents().diff(delta)

    quill.current.updateContents(diff)
  }, [textString])

  return [ref, quill.current]
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

function initializeDocument(doc: TextDoc) {
  doc.text = new Automerge.Text()
  doc.text.insertAt(0, '\n') // Quill prefers an ending newline.
}

ContentTypes.register({
  type: 'text',
  name: 'Text',
  icon: 'sticky-note',
  initializeDocument,
  contexts: {
    board: TextContent,
    workspace: TextContent,
  },
})
