import React, { useState } from 'react'

import ContentTypes from '../ContentTypes'
import Content, { ContentProps } from './Content'
import { createDocumentLink, HypermergeUrl } from '../ShareLink'
import { useDocument } from '../Hooks'

interface Message {
  authorId: HypermergeUrl
  content: string
  time: number // Unix timestamp
}

interface Doc {
  messages: Message[]
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  localeMatcher: 'best fit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  day: 'numeric',
})

ThreadContent.minWidth = 9
ThreadContent.minHeight = 6
ThreadContent.defaultWidth = 16
ThreadContent.defaultHeight = 18
ThreadContent.maxWidth = 24
ThreadContent.maxHeight = 36

export default function ThreadContent(props: ContentProps) {
  const [message, setMessage] = useState('')
  const [doc, changeDoc] = useDocument<Doc>(props.hypermergeUrl)

  if (!doc) {
    return null
  }

  const { messages } = doc
  const groupedMessages = groupBy(messages, 'authorId')

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    setMessage(e.target.value)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation()

    if (e.key === 'Enter' && !e.shiftKey && message) {
      e.preventDefault()

      changeDoc((threadDoc: Doc) => {
        threadDoc.messages.push({
          authorId: props.selfId,
          content: message,
          time: new Date().getTime(),
        })
      })

      setMessage('')
    }
  }

  return (
    <div style={css.threadWrapper}>
      <div style={css.messageWrapper}>
        <div style={css.messages} onScroll={stopPropagation}>
          {groupedMessages.map(renderGroupedMessages)}
        </div>
      </div>
      <div style={css.inputWrapper}>
        <input
          style={css.input}
          value={message}
          onKeyDown={onKeyDown}
          onChange={onInput}
          onPaste={stopPropagation}
          placeholder="Enter your message..."
        />
      </div>
    </div>
  )
}

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation()
}

function renderMessage({ content, time }: Message, idx: number) {
  const date = new Date()
  date.setTime(time)

  return (
    <div style={css.message} key={idx}>
      <div style={css.content}>{content}</div>
      {idx === 0 ? <div style={css.time}>{dateFormatter.format(date)}</div> : null}
    </div>
  )
}

function renderGroupedMessages(groupOfMessages: Message[], idx: number) {
  return (
    <div style={css.messageGroup} key={idx}>
      <Content context="thread" url={createDocumentLink('contact', groupOfMessages[0].authorId)} />
      <div style={css.groupedMessages}>{groupOfMessages.map(renderMessage)}</div>
    </div>
  )
}

function groupBy<T, K extends keyof T>(items: T[], key: K): T[][] {
  const grouped: T[][] = []
  let currentGroup: T[]

  items.forEach((item) => {
    if (!currentGroup || (currentGroup.length > 0 && currentGroup[0][key] !== item[key])) {
      currentGroup = []
      grouped.push(currentGroup)
    }

    currentGroup.push(item)
  })

  return grouped
}

const css: { [k: string]: React.CSSProperties } = {
  threadWrapper: {
    display: 'flex',
    backgroundColor: 'white',
    width: '100%',
    overflow: 'auto',
    height: '100%',
    padding: '1px 1px 0px 1px',
  },
  messageWrapper: {
    padding: 12,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column-reverse',
    overflowY: 'scroll',
    marginBottom: 49,
    flexGrow: 1,
  },
  messageGroup: {
    marginBottom: -24,
    paddingTop: 12,
  },
  groupedMessages: {
    position: 'relative',
    top: -20,
    paddingLeft: 40 + 8,
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    flexGrow: 1,
  },
  message: {
    color: 'black',
    display: 'flex',
    lineHeight: '20px',
    padding: '2px 0',
  },
  user: {
    display: 'flex',
  },
  username: {
    paddingLeft: 8,
    fontSize: 12,
    color: 'var(--colorBlueBlack)',
  },
  avatar: {},
  time: {
    flex: 'none',
    position: 'absolute',
    right: 0,
    fontSize: 12,
    color: 'var(--colorSecondaryGrey)',
    marginTop: -22,
  },
  content: {},
  inputWrapper: {
    boxSizing: 'border-box',
    width: 'calc(100% - 2px)',
    borderTop: '1px solid var(--colorInputGrey)',
    position: 'absolute',
    bottom: 1,
    backgroundColor: 'white',
    padding: 8,
  },
  input: {
    width: '100%',
  },
}

function initializeDocument(threadDoc: Doc) {
  threadDoc.messages = []
}

ContentTypes.register({
  type: 'thread',
  name: 'Thread',
  icon: 'comments',
  contexts: {
    workspace: ThreadContent,
    board: ThreadContent,
  },
  initializeDocument,
})
