import React, { useRef, useEffect } from 'react'
import CodeMirror from 'codemirror'
import 'codemirror/addon/mode/loadmode'
import 'codemirror/mode/meta'
import '../../../../node_modules/codemirror/lib/codemirror.css'
import './CodeContent.css'
import DiffMatchPatch from 'diff-match-patch'
import Debug from 'debug'
import Automerge from 'automerge'
import { Handle } from 'hypermerge'
import ContentTypes from '../../ContentTypes'
import Badge from '../Badge'
import TitleEditor from '../TitleEditor'
import * as ContentData from '../../ContentData'
import { ContentProps } from '../Content'
import { useDocument, useStaticCallback } from '../../Hooks'

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

interface CodeDoc {
  title: string
  text: Automerge.Text
}

interface Props extends ContentProps {
  uniquelySelected: boolean
}

interface CodeMirrorProps {
  text: Automerge.Text | null
  title: string | null
  selected?: boolean
  change(cb: (doc: CodeDoc) => void): void
}

CodeContent.minWidth = 6
CodeContent.minHeight = 2
CodeContent.defaultWidth = 12
// no default height to allow it to grow
CodeContent.maxWidth = 24
CodeContent.maxHeight = 36

CodeMirror.modeURL = 'codemirror/mode/%N/%N'

export default function CodeContent(props: Props) {
  const [doc, changeDoc] = useDocument<CodeDoc>(props.hypermergeUrl)

  const [ref] = useCodeMirror({
    text: doc && doc.text,
    title: doc && doc.title,
    selected: props.uniquelySelected,
    change(cb) {
      changeDoc((doc) => {
        doc.text && cb(doc)
      })
    },
  })

  return (
    <div className="CodeMirrorEditor">
      <div
        id={`editor-${props.hypermergeUrl}`}
        className="CodeMirrorEditor__editor"
        ref={ref}
        onPaste={stopPropagation}
      />
    </div>
  )
}

function CodeInList(props: ContentProps) {
  const [doc] = useDocument<CodeDoc>(props.hypermergeUrl)
  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', props.url)
  }

  if (!doc) return null

  return (
    <div className="DocLink">
      <span draggable onDragStart={onDragStart}>
        <Badge icon={ICON} />
      </span>
      <TitleEditor url={props.hypermergeUrl} />
    </div>
  )
}

function useCodeMirror({ text, title, change, selected }: CodeMirrorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const codeMirrorRef = useRef<CodeMirror | null>(null)
  const makeChange = useStaticCallback(change)

  log(title)

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
      const addedText: string = change.text.join('\n')

      makeChange(({ text }) => {
        if (removedLength > 0) {
          text.deleteAt!(at, removedLength)
        }

        if (addedText.length > 0) {
          text.insertAt!(at, ...addedText.split(''))
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
      autofocus: selected,
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
    const codeMirror = codeMirrorRef.current

    // Short circuit if the text has not loaded yet.
    if (!text || !codeMirror) {
      return
    }

    if (title) {
      const offset = title.lastIndexOf('.')
      const extension = offset >= 0 ? title.slice(offset + 1) : null
      const info = extension && CodeMirror.findModeByExtension(extension)
      const mode = codeMirror.getOption('mode')
      if (info && info.mime !== mode) {
        codeMirror.setOption('mode', info.mime)
        CodeMirror.autoLoadMode(codeMirror, info.mode)
      }
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
  }, [text])

  // Ensure the CodeMirror editor is focused if we expect it to be.
  useEffect(() => {
    const codeMirror = codeMirrorRef.current
    if (!codeMirror) {
      return
    }

    if (selected && !codeMirror.hasFocus()) {
      log('ensureFocus.forceFocus')
      codeMirror.focus()
    }
  }, [selected])

  return [editorRef, codeMirrorRef.current]
}

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation()
}

async function createFrom(contentData: ContentData.ContentData, handle: Handle<CodeDoc>, callback) {
  const text = await ContentData.toString(contentData)
  handle.change((doc) => {
    const { name = '', extension } = contentData
    doc.title = extension ? `${name}.${extension}` : name
    doc.text = new Automerge.Text()
    if (text) {
      doc.text.insertAt!(0, ...text.split(''))
    }
  })
  callback()
}

function create({ text, name, extension }, handle: Handle<CodeDoc>, callback) {
  handle.change((doc) => {
    doc.title = extension ? `${name}.${extension}` : name
    doc.text = new Automerge.Text(text)
  })

  callback()
}

const ICON = 'code'

ContentTypes.register({
  type: 'code',
  name: 'Code',
  icon: ICON,
  contexts: {
    workspace: CodeContent,
    board: CodeContent,
    list: CodeInList,
  },
  create,
  createFrom,
})
