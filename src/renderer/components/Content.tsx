import React, { useState, useCallback, useContext, useEffect } from 'react'

import ContentTypes, { Context } from '../ContentTypes'
import { parseDocumentLink, HypermergeUrl, PushpinUrl } from '../ShareLink'
import SelfContext from './SelfContext'
import Crashable from './Crashable'
import { useHeartbeat } from '../PresenceHooks'

// this is the interface imported by Content types
export interface ContentProps {
  context: Context
  url: PushpinUrl
  type: string
  hypermergeUrl: HypermergeUrl
  selfId: HypermergeUrl
}

// These are the props the generic Content wrapper receives
interface Props {
  url: PushpinUrl
  context: Context
  [arbitraryProp: string]: any
}

export default React.memo(Content)

function Content(props: Props) {
  const { context, url } = props

  const [isCrashed, setCrashed] = useState(false)
  const selfId = useContext(SelfContext)
  const onCatch = useCallback(() => setCrashed(true), [])

  const { type, hypermergeUrl } = parseDocumentLink(url)

  useHeartbeat(['workspace', 'board'].includes(context) ? hypermergeUrl : null)

  useEffect(() => {
    setCrashed(false)
  }, [url])

  if (!url) {
    return null
  }

  const contentType = ContentTypes.lookup({ type, context })

  if (!contentType) {
    return renderMissingType(type, context)
  }

  if (isCrashed) {
    return renderError(type)
  }

  return (
    <Crashable onCatch={onCatch}>
      <contentType.component
        {...props}
        key={url}
        type={type}
        hypermergeUrl={hypermergeUrl}
        selfId={selfId}
      />
    </Crashable>
  )
}

function renderError(type: string) {
  return (
    <div>
      <i className="fa fa-exclamation-triangle" />A &quot;{type}&quot; threw an error during render.
    </div>
  )
}

function renderMissingType(type: string, context: Context) {
  return (
    <div>
      <i className="fa fa-exclamation-triangle" />
      Component of type &quot;{type}&quot; in context &quot;{context}&quot; not found.
    </div>
  )
}
