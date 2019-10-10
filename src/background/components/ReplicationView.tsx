import React from 'react'
import { useSample } from '../BackgroundHooks'
import Info from './Info'

export default function ReplicationView() {
  const samples = useSample(3000)

  return (
    <div
      style={{
        display: 'grid',
        gridGap: 8,
      }}
    >
      <Info samples={samples} />
      Nothing here yet
    </div>
  )
}
