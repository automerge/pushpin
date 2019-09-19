import React from 'react'
import { RepoBackend, DocUrl } from 'hypermerge'
import DocView from './DocView'
import { RepoContext, useWindowVisibility } from '../BackgroundHooks'
import '../../renderer/app.css'
import '../main.css'

interface Props {
  repo: RepoBackend
  currentUrl: DocUrl | null
}

export default function Root(props: Props) {
  const { repo, currentUrl } = props
  const isWindowVisible = useWindowVisibility()

  if (!isWindowVisible) return null
  if (!currentUrl) return null

  return (
    <div id="root" style={{ margin: 10 }}>
      <RepoContext.Provider value={repo}>
        <DocView url={currentUrl} />
      </RepoContext.Provider>
    </div>
  )
}
