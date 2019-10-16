import React from 'react'
import { useSample, useRepo } from '../BackgroundHooks'
import Info, { hidden } from './Info'

export default function ReplicationView() {
  useSample(3000)
  const { replication } = useRepo()

  return (
    <div
      style={{
        display: 'grid',
        gridGap: 8,
      }}
    >
      <Info
        log={replication}
        known={hidden(`${replication.discoveryIds.size} feeds`, () =>
          Array.from(replication.discoveryIds.values())
        )}
      />
      Nothing here yet
    </div>
  )
}
