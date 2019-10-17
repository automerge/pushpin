import React from 'react'
import { RepoBackend, DocUrl } from 'hypermerge'
import DocView from './DocView'
import { RepoContext, useWindowVisibility } from '../BackgroundHooks'
import '../../renderer/app.css'
import '../main.css'
import NetworkView from './NetworkView'
import ReplicationView from './ReplicationView'
import Tabs from './Tabs'
import FeedStoreView from './FeedStoreView'

interface Props {
  repo: RepoBackend
  currentUrl: DocUrl | null
}

export default function Root(props: Props) {
  const { repo, currentUrl } = props
  const isWindowVisible = useWindowVisibility()

  if (!isWindowVisible) return <div>Window not visible.</div>

  return (
    <div id="root">
      <RepoContext.Provider value={repo}>
        <Tabs
          CurrentDoc={() =>
            currentUrl ? <DocView url={currentUrl} /> : <div>No current doc.</div>
          }
          Network={() => <NetworkView />}
          Replication={() => <ReplicationView />}
          FeedStore={() => <FeedStoreView />}
        />
      </RepoContext.Provider>
    </div>
  )
}
