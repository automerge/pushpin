import React, {
  useState,
  useCallback,
  useEffect,
  forwardRef,
  Ref,
  memo,
  RefForwardingComponent,
} from 'react'

import * as ContentTypes from '../ContentTypes'
import { parseDocumentLink, HypermergeUrl, PushpinUrl } from '../ShareLink'
import Crashable from './Crashable'
import { useHeartbeat } from '../PresenceHooks'
import { useSelfId } from '../Hooks'

// this is the interface imported by Content types
export interface ContentProps {
  context: ContentTypes.Context
  url: PushpinUrl
  type: string
  hypermergeUrl: HypermergeUrl
  selfId: HypermergeUrl
  contentRef?: Ref<ContentHandle>
}

// These are the props the generic Content wrapper receives
interface Props {
  url: PushpinUrl
  context: ContentTypes.Context
  [arbitraryProp: string]: any
}

export interface ContentHandle {
  onContent: (url: PushpinUrl) => boolean
}

const Content: RefForwardingComponent<ContentHandle, Props> = (
  props: Props,
  ref: Ref<ContentHandle>
) => {
  const { context, url } = props

  const [isCrashed, setCrashed] = useState(false)
  const selfId = useSelfId()
  const onCatch = useCallback(() => setCrashed(true), [])

  const { type, hypermergeUrl } = parseDocumentLink(url)

  useHeartbeat(['workspace'].includes(context) ? hypermergeUrl : null)

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
        contentRef={ref}
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

function renderMissingType(type: string, context: ContentTypes.Context) {
  return (
    <div>
      <i className="fa fa-exclamation-triangle" />
      Component of type &quot;{type}&quot; in context &quot;{context}&quot; not found.
    </div>
  )
}

export default memo(forwardRef(Content))
