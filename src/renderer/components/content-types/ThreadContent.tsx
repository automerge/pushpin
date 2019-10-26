import React, { useState } from 'react'

import ContentTypes from '../../ContentTypes'
import Content, { ContentProps } from '../Content'
import { createDocumentLink, HypermergeUrl } from '../../ShareLink'
import { useDocument } from '../../Hooks'
import './ThreadContent.css'

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
    <div className="threadWrapper">
      <div className="messageWrapper">
        <div className="messages" onScroll={stopPropagation}>
          {groupedMessages.map(renderGroupedMessages)}
        </div>
      </div>
      <div className="inputWrapper">
        <input
          className="messageInput"
          value={message}
          onKeyDown={onKeyDown}
          onChange={onInput}
          onPaste={stopPropagation}
          onCut={stopPropagation}
          onCopy={stopPropagation}
          placeholder="Enter your message..."
        />
      </div>
    </div>
  )
}

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
}

function renderMessage({ content, time }: Message, idx: number) {
  const date = new Date()
  date.setTime(time)

  return (
    <div className="message" key={idx}>
      <div className="content">{content}</div>
      {idx === 0 ? <div className="time">{dateFormatter.format(date)}</div> : null}
    </div>
  )
}

function renderGroupedMessages(groupOfMessages: Message[], idx: number) {
  return (
    <div className="messageGroup" key={idx}>
      <Content context="thread" url={createDocumentLink('contact', groupOfMessages[0].authorId)} />
      <div className="groupedMessages">{groupOfMessages.map(renderMessage)}</div>
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

function create(unusedAttrs, handle, callback) {
  handle.change((doc) => {
    doc.messages = []
  })
  callback()
}

ContentTypes.register({
  type: 'thread',
  name: 'Thread',
  icon: 'comments',
  contexts: {
    workspace: ThreadContent,
    board: ThreadContent,
  },
  create,
})
