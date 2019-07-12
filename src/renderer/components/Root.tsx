import React from 'react'
import Content from './Content'

// We load these modules here so that the content registry will have them.
import './workspace/Workspace'

// default context components
import './defaults/DefaultInList'

// board in various contexts
import './board'
import './contact'

// other single-context components
import './TextContent'
import './ImageContent'
import './ThreadContent'
import './UrlContent'
import './PdfContent'

interface Props {
  url: string
}

export default function Root(props: Props) {
  return <Content context="root" url={props.url} />
}
