import React, { useCallback, useEffect, useRef, useMemo } from 'react'

import Automerge from 'automerge'
import Quill, { TextChangeHandler, QuillOptionsStatic } from 'quill'
import Delta from 'quill-delta'
import ContentTypes from '../ContentTypes'
import { ContentProps } from './Content'
import { useDocument } from '../Hooks'
import './QuillContent.css'

interface TextDoc {
  text: Automerge.Text
}

TextContent.minWidth = 6
TextContent.minHeight = 2
TextContent.defaultWidth = 12
TextContent.defaultHeight = 8

export default function TextContent(props: ContentProps) {
  const [doc, changeDoc] = useDocument<TextDoc>(props.hypermergeUrl)

  const [ref] = useQuill(
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

  return <div className="QuillContent" ref={ref} onPaste={stopPropagation} />
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
    const container = ref.current
    const q = new Quill(container, options)
    quill.current = q

    if (textString) q.setText(textString)

    const onChange: TextChangeHandler = (changeDelta, _oldContents, source) => {
      if (source !== 'user') return

      makeChange((content) => applyDeltaToText(content, changeDelta))
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Backspace') {
        e.stopPropagation()
        return
      }

      const str = q.getText()
      if (str !== '' && str !== '\n') {
        e.stopPropagation()
      }
    }

    q.on('text-change', onChange)

    /**
     * We bind this as a native event because of React's event delegation.
     * Quill will handle the keydown event and cause a react re-render before react has actually
     * seen the event at all. This causes a race condition where the doc looks like it was already
     * empty when Backspace is pressed, even though that very keypress made it empty.
     */
    container.addEventListener('keydown', onKeyDown, { capture: true })

    return () => {
      quill.current = null
      container.removeEventListener('keydown', onKeyDown, { capture: true })
      q.off('text-change', onChange)
      // Quill gets garbage collected automatically
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

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
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
