import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  forwardRef,
  memo,
  RefForwardingComponent,
  useImperativeHandle,
  useRef,
} from 'react'

import * as ContentTypes from '../ContentTypes'
import { parseDocumentLink, HypermergeUrl, PushpinUrl } from '../ShareLink'
import SelfContext from './SelfContext'
import Crashable from './Crashable'
import { useHeartbeat } from '../PresenceHooks'

// this is the interface imported by Content types
export interface ContentProps {
  context: ContentTypes.Context
  url: PushpinUrl
  type: string
  hypermergeUrl: HypermergeUrl
  selfId: HypermergeUrl
}

// These are the props the generic Content wrapper receives
interface Props {
  url: PushpinUrl
  context: ContentTypes.Context
  [arbitraryProp: string]: any
}

export interface ContentHandle {
  onContent: (PushpinUrl) => void
}

const Content: RefForwardingComponent<ContentHandle, Props> = (props: Props, ref) => {
  const contentRef = useRef<any>() // yikes
  useImperativeHandle(ref, () => ({
    canReceiveContent: () => {
      if (contentRef.current && contentRef.current.canReceiveContent) {
        return contentRef.current.canReceiveContent()
      }
      return false
    },
    onContent: (url: PushpinUrl) => {
      if (contentRef.current && contentRef.current.onContent) {
        return contentRef.current.onContent(url)
      }

      throw new Error(`no onContent defined for ${ref}`)
    },
  }))

  const { context, url } = props

  const [isCrashed, setCrashed] = useState(false)
  const selfId = useContext(SelfContext)
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
        ref={contentRef}
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
