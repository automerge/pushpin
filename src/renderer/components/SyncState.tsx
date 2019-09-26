import React from 'react'
import './SyncState.css'

/**
 * inspired by the github branches widget
 */

interface SyncStateProps {
  ahead: number
  behind: number
}

function numberToUsefulLogPercentage(unscaled: number) {
  const logged = Math.log10(unscaled)
  const capped = Math.min(3, logged)
  const scaled = capped / 3.0 // 0-1 range
  return `${scaled * 100}%`
}

export default function SyncState(props: SyncStateProps) {
  const { ahead, behind } = props

  if (ahead === 0 && behind === 0) {
    return (
      <div className="SyncState">
        <div className="SyncState--label">Synced!</div>
      </div>
    )
  }

  return (
    <div className="SyncState" data-ahead={ahead} data-behind={behind}>
      <div className="SyncState--behind SyncState--side">
        <div className="SyncState--label">{behind}</div>
        <div
          className="SyncState--bar SyncState--bar-behind"
          style={{ width: numberToUsefulLogPercentage(behind) }}
        />
      </div>
      <div className="SyncState--ahead SyncState--side">
        <div className="SyncState--label">{ahead}</div>
        <span
          className="SyncState--bar SyncState--bar-ahead"
          style={{ width: numberToUsefulLogPercentage(ahead) }}
        />
      </div>
    </div>
  )
}
