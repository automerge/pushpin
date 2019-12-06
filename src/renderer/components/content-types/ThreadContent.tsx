import React, { useState } from 'react'

import * as ContentTypes from '../../ContentTypes'
import Content, { ContentProps } from '../Content'
import { createDocumentLink, HypermergeUrl } from '../../ShareLink'
import { useDocument } from '../../Hooks'
import ListItem from '../ui/ListItem'
import Badge from '../ui/Badge'
import ContentDragHandle from '../ui/ContentDragHandle'
import TitleWithSubtitle from '../ui/TitleWithSubtitle'
import './ThreadContent.css'

interface Message {
  authorId: HypermergeUrl
  content: string
  time: number // Unix timestamp
}

interface Doc {
  title?: string
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

export function ThreadInList(props: ContentProps) {
  const { hypermergeUrl, url } = props
  const [doc] = useDocument<Doc>(hypermergeUrl)
  if (!doc) return null

  const title = doc.title != null && doc.title !== '' ? doc.title : 'Untitled conversation'
  const subtitle = (doc.messages[doc.messages.length - 1] || { content: '' }).content
  const editable = true

  return (
    <ListItem>
      <ContentDragHandle url={url}>
        <Badge icon={icon} />
      </ContentDragHandle>
      <TitleWithSubtitle
        titleEditorField="title"
        title={title}
        subtitle={subtitle}
        hypermergeUrl={hypermergeUrl}
        editable={editable}
      />
    </ListItem>
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

function create(unusedAttrs, handle) {
  handle.change((doc) => {
    doc.messages = []
  })
}

const icon = 'comments'

ContentTypes.register({
  type: 'thread',
  name: 'Thread',
  icon,
  contexts: {
    workspace: ThreadContent,
    board: ThreadContent,
    list: ThreadInList,
    'title-bar': ThreadInList,
  },
  create,
})
