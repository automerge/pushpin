import React, { useEffect, useRef, useMemo } from 'react'

import Automerge from 'automerge'
import Quill, { TextChangeHandler, QuillOptionsStatic } from 'quill'
import Delta from 'quill-delta'
import ContentTypes from '../ContentTypes'
import { ContentProps } from './Content'
import { useDocument, useStaticCallback } from '../Hooks'
import './TextContent.css'

interface TextDoc {
  text: Automerge.Text
}

interface Props extends ContentProps {
  uniquelySelected?: boolean
}

TextContent.minWidth = 6
TextContent.minHeight = 2
TextContent.defaultWidth = 12

export default function TextContent(props: Props) {
  const [doc, changeDoc] = useDocument<TextDoc>(props.hypermergeUrl)

  const [ref] = useQuill({
    text: doc && doc.text,
    change(fn) {
      changeDoc((doc) => fn(doc.text))
    },
    selected: props.uniquelySelected,
    config: {
      placeholder: 'Type something...',
      formats: [],
      modules: {
        toolbar: false,
        history: {
          maxStack: 500,
          userOnly: true,
        },
      },
    },
  })

  return <div className="TextContent" ref={ref} onPaste={stopPropagation} />
}

interface QuillOpts {
  text: Automerge.Text | null
  change: (cb: (text: Automerge.Text) => void) => void
  selected?: boolean
  config?: QuillOptionsStatic
}

function useQuill({
  text,
  change,
  selected,
  config,
}: QuillOpts): [React.Ref<HTMLDivElement>, Quill | null] {
  const ref = useRef<HTMLDivElement>(null)
  const quill = useRef<Quill | null>(null)
  const textString = useMemo(() => text && text.join(''), [text])
  const makeChange = useStaticCallback(change)

  useEffect(() => {
    if (!ref.current) return () => {}

    const container = ref.current
    const q = new Quill(container, { scrollingContainer: container, ...config })
    quill.current = q

    if (textString) q.setText(textString)
    if (selected) q.focus()

    const onChange: TextChangeHandler = (changeDelta, _oldContents, source) => {
      if (source !== 'user') return

      makeChange((content) => applyDeltaToText(content, changeDelta))
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Backspace') return

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
