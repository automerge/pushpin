import React from 'react'

import { RepoFrontend } from 'hypermerge'
import Content from './Content'
import { RepoContext } from '../Hooks'
import { PushpinUrl } from '../ShareLink'

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
  url: PushpinUrl
  repo: RepoFrontend
}

export default function Root({ repo, url }: Props) {
  return (
    <RepoContext.Provider value={repo}>
      <Content context="root" url={url} />
    </RepoContext.Provider>
  )
}
