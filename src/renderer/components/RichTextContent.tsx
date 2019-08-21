// import React, { useCallback, useEffect, useRef, useMemo } from 'react'

// // import Automerge from 'automerge'
// import Quill, { TextChangeHandler, QuillOptionsStatic } from 'quill'
// import Delta from 'quill-delta'
// import ContentTypes from '../ContentTypes'
// import { ContentProps } from './Content'
// import { useDocument } from '../Hooks'
// import './RichTextContent.css'

// interface Format {
//   italic: boolean
//   bold: boolean
// }

// type Item = string | Format
// type Content = Item[]

// interface RichTextDoc {
//   content: Content
// }

// RichTextContent.minWidth = 6
// RichTextContent.minHeight = 2
// RichTextContent.defaultWidth = 12
// RichTextContent.defaultHeight = 8

// export default function RichTextContent(props: ContentProps) {
//   const [doc, changeDoc] = useDocument<RichTextDoc>(props.hypermergeUrl)

//   const ref = useQuill(
//     doc && doc.content,
//     (fn) => {
//       changeDoc((doc) => fn(doc.content))
//     },
//     {
//       placeholder: 'Type something...',
//     }
//   )

//   if (!doc) return null

//   return <div className="RichTextContent" ref={ref} />
// }

// function useQuill(
//   content: Content | null,
//   changeFn: (cb: (content: Content) => void) => void,
//   options?: QuillOptionsStatic
// ): React.Ref<HTMLDivElement> {
//   const ref = useRef<HTMLDivElement>(null)
//   const quill = useRef<Quill | null>(null)
//   const delta = useMemo(() => content && contentToDelta(content), [content])
//   const makeChange = useStaticCallback(changeFn)

//   useEffect(() => {
//     if (!ref.current) return () => {}

//     const q = new Quill(ref.current, options)
//     quill.current = q

//     if (delta) q.setContents(delta)

//     const onChange: TextChangeHandler = (changeDelta, _oldContents, source) => {
//       console.log('change', source, changeDelta)
//       if (source !== 'user') return

//       makeChange((content) => applyDeltaToContent(content, changeDelta))
//     }

//     q.on('text-change', onChange)

//     return () => {
//       quill.current = null
//       q.off('text-change', onChange)
//       // TODO: destroy quill instance
//     }
//   }, [ref.current])

//   useEffect(() => {
//     if (!delta || !quill.current) return

//     quill.current && quill.current.setContents(delta)
//   }, [delta])

//   return ref
// }

// function useStaticCallback<T extends (...args: any[]) => any>(callback: T): T {
//   const cb = useRef<T>(callback)
//   cb.current = callback

//   return useCallback((...args: any[]) => cb.current(...args), []) as T
// }

// function applyDeltaToContent(content: Content, delta: Delta): void {
//   const i = 0
//   let cursor = 0

//   delta.forEach((op, idx) => {
//     if (op.retain) {
//       cursor += op.retain
//       // while (true) {
//       //   if (typeof content[i] === 'string') i += 1
//       // }
//     }

//     // if (typeof op.insert === 'string') {
//     //   const chars = op.insert.split('')
//     //   content.splice(i, 0, ...chars)
//     //   i += chars.length
//     // } else if (typeof op.insert === 'object') {
//     //   content.splice()
//     // }
//   })
// }

// function contentToDelta(content: Content): Delta {
//   const delta = new Delta()
//   let str = ''
//   let format: Format | undefined

//   for (let i = 0, l = content.length; i < l; i += 1) {
//     const item = content[i]

//     if (typeof item === 'string') {
//       str += item
//     } else {
//       delta.insert(str, format)
//       format = item
//       str = ''
//     }
//   }

//   delta.insert(str)

//   return delta
// }

// function initializeDocument(doc: RichTextDoc) {
//   doc.content = []
// }

// ContentTypes.register({
//   name: 'Rich Text',
//   type: 'rich-text',
//   initializeDocument,
//   contexts: {
//     board: RichTextContent,
//     workspace: RichTextContent,
//   },
//   icon: 'newspaper',
// })
