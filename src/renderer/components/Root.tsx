import React from 'react'

import { RepoFrontend } from 'hypermerge'
import Content from './Content'
import { RepoContext } from '../Hooks'
import { PushpinUrl } from '../ShareLink'

// We load these modules here so that the content registry will have them.
import './content-types/workspace/Workspace'

// default context components
import './content-types/defaults/DefaultInList'

// board in various contexts
import './content-types/board'
import './content-types/contact'

// other single-context components
import './content-types/TextContent'
import './content-types/ThreadContent'
import './content-types/UrlContent'
import './content-types/files/FileContent'
import './content-types/files/ImageContent'
import './content-types/files/AudioContent'
import './content-types/files/VideoContent'
import './content-types/files/PdfContent'

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
