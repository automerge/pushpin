import React, { useEffect, useRef, useMemo } from 'react'
import { Handle } from 'hypermerge'

import Automerge from 'automerge'
import Quill, { TextChangeHandler, QuillOptionsStatic } from 'quill'
import MarkdownShortcuts from 'quill-markdown-shortcuts'

import ContentTypes from '../../ContentTypes'
import { ContentProps } from '../Content'
import { useDocument, useStaticCallback } from '../../Hooks'
import './TextContent.css'
import { textToDelta, applyDeltaToText } from '../../TextDelta'

interface TextDoc {
  text: Automerge.Text
}

interface Props extends ContentProps {
  uniquelySelected?: boolean
}

TextContent.minWidth = 6
TextContent.minHeight = 2
TextContent.defaultWidth = 12

Quill.register('modules/markdownShortcuts', MarkdownShortcuts)

export default function TextContent(props: Props) {
  const [doc, changeDoc] = useDocument<TextDoc>(props.hypermergeUrl)

  const [quillRef] = useQuill({
    text: doc && doc.text,
    change(fn) {
      changeDoc((doc) => fn(doc.text))
    },
    selected: props.uniquelySelected,
    config: {
      theme: 'snow',
      modules: {
        markdownShortcuts: {},
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'], // toggled buttons
          ['blockquote', 'code-block'],

          [{ header: 1 }, { header: 2 }], // custom button values
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
          [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
          [{ direction: 'rtl' }], // text direction

          [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
          [{ header: [1, 2, 3, 4, 5, 6, false] }],

          [{ color: [] }, { background: [] }], // dropdown with defaults from theme
          [{ font: [] }],
          [{ align: [] }],

          ['clean'], // remove formatting button
        ],

        history: {
          maxStack: 500,
          userOnly: true,
        },
      },
    },
  })

  const shouldHideToolbar = props.context !== 'workspace'

  return (
    <div
      className={`TextContent ${shouldHideToolbar ? 'hide-ql-toolbar' : ''}`}
      onPaste={stopPropagation}
    >
      <div ref={quillRef} />
    </div>
  )
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
  const textDelta = useMemo(() => text && textToDelta(text), [text])
  const makeChange = useStaticCallback(change)

  useEffect(() => {
    if (!ref.current) return () => {}
    if (quill.current) return () => {}

    const container = ref.current

    const q = new Quill(container, { scrollingContainer: container, ...config })
    quill.current = q

    if (textDelta) q.setContents(textDelta)
    if (selected) q.focus()

    const onChange: TextChangeHandler = (changeDelta, _oldContents, source) => {
      if (source !== 'user') return

      makeChange((content) => {
        applyDeltaToText(content, changeDelta)
      })
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
    if (!textDelta || !quill.current) return

    const diff = quill.current.getContents().diff(textDelta)

    quill.current.updateContents(diff)
  }, [textDelta])

  return [ref, quill.current]
}

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
}

function createFromFile(entry: File, handle: Handle<TextDoc>, callback) {
  const reader = new FileReader()

  reader.onload = () => {
    handle.change((doc) => {
      doc.text = new Automerge.Text()

      if (reader.result) {
        const text = reader.result as string

        doc.text.insertAt!(0, ...text.split('')) // eslint-disable-line

        if (!text || !text.endsWith('\n')) {
          doc.text.insertAt!(text ? text.length : 0, '\n') // Quill prefers an ending newline
        }
      }
    })
    callback()
  }

  reader.readAsText(entry)
}

function create({ text = '' }, handle: Handle<TextDoc>, callback) {
  handle.change((doc) => {
    doc.text = new Automerge.Text(text)
    if (!text.endsWith('\n')) {
      doc.text.insertAt!(text.length, '\n') // Quill prefers an ending newline
    }
  })

  callback()
}

const supportsMimeType = (mimeType) => !!mimeType.match('text/')

ContentTypes.register({
  type: 'text',
  name: 'Text',
  icon: 'sticky-note',
  contexts: {
    board: TextContent,
    workspace: TextContent,
  },
  create,
  createFromFile,
  supportsMimeType,
})
