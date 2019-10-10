import React from 'react'
import { RepoBackend, DocUrl } from 'hypermerge'
import DocView from './DocView'
import { RepoContext, useWindowVisibility } from '../BackgroundHooks'
import '../../renderer/app.css'
import '../main.css'
import NetworkView from './NetworkView'
import ReplicationView from './ReplicationView'
import Tabs from './Tabs'

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
    <div id="root">
      <RepoContext.Provider value={repo}>
        <Tabs
          CurrentDoc={() => <DocView url={currentUrl} />}
          Network={() => <NetworkView />}
          Replication={() => <ReplicationView />}
        />
      </RepoContext.Provider>
    </div>
  )
}
