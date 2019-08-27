import React, { useRef, useEffect } from 'react'
import CodeMirror from 'codemirror'
import DiffMatchPatch from 'diff-match-patch'
import Debug from 'debug'
import Automerge from 'automerge'

import ContentTypes from '../ContentTypes'
import Content, { ContentProps } from './Content'
import { useDocument } from '../Hooks'
import { createDocumentLink } from '../ShareLink'

const log = Debug('pushpin:code-mirror-editor')

// This is plain text note component with inline editing.
//
// It's a tricky component because it needs to bridge the functional-reactive
// world of React with the imperative world of the CodeMirror editor, as well
// as some data model mismatch between the Automerge.Text property and the
// CodeMirror instance.
//
// Key ideas:
// * The Automerge.Text property and the CodeMirror editor are seperate state,
//   but we sync them in both directions. It's not a pure one-way data flow
//   as we have elsewhere in the app.
// * When the user does a local change in the editor, we pick that up and
//   convert it into a corresponding Automerge.Text change. This causes
//   updates to go out to other clients.
// * When we see an Automerge.Text update, we apply changes to the editor to
//   converge the editor's contents to those indicated in the Automerge.Text.
// * Cursor state is managed only by CodeMirror. This means cursor state
//   definetly remains correct when the user does local editing. Also when we
//   apply remote ops to CodeMirror through its programtic editing APIs, the
//   editor should automatically do the right thing with the user's cursor.
//
// This component is not "pure" in the literal sense. But PureComponent still
// seems to give the right caching behaviour, so for now we'll extend from it.

interface TextDoc {
  text?: Automerge.Text
}

interface Props extends ContentProps {
  uniquelySelected: boolean
}

TextContent.minWidth = 6
TextContent.minHeight = 2
TextContent.defaultWidth = 12
// no default height to allow it to grow
TextContent.maxWidth = 24
TextContent.maxHeight = 36

export default function TextContent(props: Props) {
  const [doc, changeDoc] = useDocument<TextDoc>(props.hypermergeUrl)

  const editorRef = useCodeMirror({
    text: doc && doc.text,
    selected: props.uniquelySelected,
    change(cb) {
      changeDoc((doc) => {
        doc.text && cb(doc.text)
      })
    },
  })

  return (
    <div className="CodeMirrorEditor">
      <div
        id={`editor-${props.hypermergeUrl}`}
        className="CodeMirrorEditor__editor"
        ref={editorRef}
        onPaste={stopPropagation}
      />
    </div>
  )
}

interface CodeMirrorProps {
  text?: Automerge.Text
  selected: boolean
  change(cb: (text: Automerge.Text) => void): void
}

function useCodeMirror(props: CodeMirrorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const codeMirrorRef = useRef<CodeMirror | null>(null)

  useEffect(() => {
    // Observe changes to the editor and make corresponding updates to the
    // Automerge text.
    function onCodeMirrorChange(codeMirror: CodeMirror, change: any) {
      // We don't want to re-apply changes we already applied because of updates
      // from Automerge.
      if (change.origin === 'automerge') {
        return
      }
      log('onCodeMirrorChange')

      // Convert from CodeMirror coordinate space to Automerge text/array API.
      const at = codeMirror.indexFromPos(change.from)
      const removedLength = change.removed.join('\n').length
      const addedText = change.text.join('\n')

      props.change((text) => {
        if (removedLength > 0) {
          text.splice(at, removedLength)
        }

        if (addedText.length > 0) {
          text.insertAt(at, ...addedText.split(''))
        }
      })
    }

    function onKeyDown(codeMirror: CodeMirror, e: React.KeyboardEvent) {
      if (e.key !== 'Backspace') {
        e.stopPropagation()
        return
      }

      // we normally prevent deletion by stopping event propagation
      // but if the card is already empty and we hit delete, allow it
      const text = codeMirror.getValue()
      if (text.length !== 0) {
        e.stopPropagation()
      }
    }

    // The props after `autofocus` are needed to get an editor that resizes
    // according to the size of the text, without scrollbars or wrapping.
    const codeMirror = CodeMirror(editorRef.current, {
      autofocus: props.selected,
      lineNumbers: false,
      lineWrapping: true,
      scrollbarStyle: 'null',
      viewportMargin: Infinity,
    })

    codeMirrorRef.current = codeMirror

    codeMirror.on('change', onCodeMirrorChange)
    codeMirror.on('keydown', onKeyDown)

    return () => {
      codeMirror.off('change', onCodeMirrorChange)
      codeMirror.off('keydown', onKeyDown)
    }
  }, [])

  // Transform updates from the Automerge text into imperative text changes
  // in the editor.
  useEffect(() => {
    const { text } = props
    const codeMirror = codeMirrorRef.current

    // Short circuit if the text has not loaded yet.
    if (!text || !codeMirror) {
      return
    }

    // Short circuit if we don't need to apply any changes to the editor. This
    // happens when we get a text update based on our own local edits.
    const oldStr = codeMirror.getValue()
    const newStr = text.join('')
    if (oldStr === newStr) {
      return
    }

    // Otherwise find the diff between the current and desired contents, and
    // apply corresponding editor ops to close them.
    log('forceContents')
    const dmp = new DiffMatchPatch()
    const diff = dmp.diff_main(oldStr, newStr)

    // Buffer CM's dom updates
    codeMirror.operation(() => {
      // The diff lib doesn't give indicies so we need to compute them ourself as
      // we go along.
      for (let i = 0, at = 0; i < diff.length; i += 1) {
        const [type, str] = diff[i]

        switch (type) {
          case DiffMatchPatch.DIFF_EQUAL: {
            at += str.length
            break
          }

          case DiffMatchPatch.DIFF_INSERT: {
            const fromPos = codeMirror.posFromIndex(at)
            codeMirror.replaceRange(str, fromPos, null, 'automerge')
            at += str.length
            break
          }

          case DiffMatchPatch.DIFF_DELETE: {
            const fromPos = codeMirror.posFromIndex(at)
            const toPos = codeMirror.posFromIndex(at + str.length)
            codeMirror.replaceRange('', fromPos, toPos, 'automerge')
            break
          }

          default: {
            throw new Error(`Did not expect diff type ${type}`)
          }
        }
      }
    })
  }, [props.text])

  // Ensure the CodeMirror editor is focused if we expect it to be.
  useEffect(() => {
    const codeMirror = codeMirrorRef.current
    if (!codeMirror) {
      return
    }

    if (props.selected && !codeMirror.hasFocus()) {
      log('ensureFocus.forceFocus')
      codeMirror.focus()
    }
  }, [props.selected])

  return editorRef
}

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation()
}

function initializeDocument(editor: TextDoc, { text }) {
  editor.text = new Automerge.Text()
  if (text) {
    editor.text.insertAt(0, ...text.split(''))
  }
}

function initializeContent(entry, callback) {
  const reader = new FileReader()

  reader.onload = () => {
    const contentUrl = Content.initializeContentDoc('text', { text: reader.result })
    callback(createDocumentLink('text', contentUrl))
  }

  reader.readAsText(entry)
}

function initializeContentFromAttrs(typeAttrs, callback) {
  const contentUrl = Content.initializeContentDoc('text', typeAttrs)
  callback(createDocumentLink('text', contentUrl))
}

function initializeContentNoAttrs(callback) {
  const contentUrl = Content.initializeContentDoc('text', { text: '' })
  callback(createDocumentLink('text', contentUrl))
}

ContentTypes.register({
  type: 'text',
  name: 'Text',
  icon: 'sticky-note',
  contexts: {
    workspace: TextContent,
    board: TextContent,
  },
  initializeDocument,
  initializeContent,
  initializeContentFromAttrs,
  initializeContentNoAttrs,
})
