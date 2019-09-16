import React, { useState } from 'react'
import Debug from 'debug'
import mime from 'mime-types'

import Content, { ContentProps } from '../../Content'
import { ContactDoc } from '.'
import { FileDoc } from '../files'

import { createDocumentLink, HypermergeUrl } from '../../../ShareLink'
import { DEFAULT_AVATAR_PATH } from '../../../constants'
import Text from '../../Text'
import Label from '../../Label'

import './ContactInVarious.css'
import { useDocument, useMessaging, useTimeoutWhen } from '../../../Hooks'

const log = Debug('pushpin:settings')

export default function ContactInVarious(props: ContentProps) {
  const [contact] = useDocument<ContactDoc>(props.hypermergeUrl)
  const isPresent = usePresence(props.hypermergeUrl)

  const avatarDocId = contact ? contact.avatarDocId : null
  const name = contact ? contact.name : null

  const [avatarImageDoc] = useDocument<FileDoc>(avatarDocId)
  const { hyperfileUrl = null, mimeType = 'application/octet', extension = null } =
    avatarImageDoc || {}

  const isOnline = isPresent || props.selfId === props.hypermergeUrl

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(
      'application/pushpin-url',
      createDocumentLink('contact', props.hypermergeUrl)
    )

    // and we'll add a DownloadURL
    if (hyperfileUrl) {
      const outputExtension = extension || mime.extension(mimeType) || 'bin'

      const downloadUrl = `text:${name}.${outputExtension}:${hyperfileUrl}`
      e.dataTransfer.setData('DownloadURL', downloadUrl)
    }
  }

  if (!contact) {
    return null
  }

  const { context } = props
  const { color } = contact

  const avatarImage = avatarDocId ? (
    <Content context="workspace" url={createDocumentLink('image', avatarDocId)} />
  ) : (
    <img alt="avatar" src={DEFAULT_AVATAR_PATH} />
  )

  const avatar = (
    <div
      className={`Avatar Avatar--${context} Avatar--${isOnline ? 'online' : 'offline'}`}
      style={{ ['--highlight-color' as any]: color }}
      data-name={name}
    >
      {avatarImage}
    </div>
  )

  switch (context) {
    case 'list':
      return (
        <div draggable onDragStart={onDragStart} className="DocLink">
          <div className="Contact-avatar">{avatar}</div>
          <Label>
            <Text>{name}</Text>
          </Label>
        </div>
      )

    case 'thread':
      return (
        <div style={css.user}>
          {avatar}
          <div className="username" style={css.username}>
            {name}
          </div>
        </div>
      )

    case 'title-bar':
      return (
        <div draggable onDragStart={onDragStart}>
          {avatar}
        </div>
      )

    case 'board':
      return (
        <div className="Contact--board">
          {avatar}
          <div className="Contact-boardLabel">{name}</div>
        </div>
      )

    default:
      log('contact render called in an unexpected context')
      return null
  }
}

function usePresence(url: HypermergeUrl): boolean {
  const [isPresent, set] = useState(false)

  const reset = useTimeoutWhen(isPresent, 5000, () => {
    set(false)
  })

  useMessaging(url, () => {
    reset()
    isPresent || set(true)
  })

  return isPresent
}

const css = {
  threadWrapper: {
    display: 'flex',
    backgroundColor: 'white',
    width: '100%',
    overflow: 'auto',
    height: '100%',
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
    flexGrow: '1',
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
    marginLeft: 'auto',
    fontSize: 12,
    color: 'var(--colorSecondaryGrey)',
    marginTop: -22,
  },
  content: {},
  inputWrapper: {
    boxSizing: 'border-box',
    width: 'calc(100% - 1px)',
    borderTop: '1px solid var(--colorInputGrey)',
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'white',
    padding: 8,
  },
  input: {
    width: '100%',
  },
}
