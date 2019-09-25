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
  return scaled
}

export default function SyncState(props: SyncStateProps) {
  const { ahead, behind } = props

  return (
    <div className="SyncState" data-ahead={ahead} data-behind={behind}>
      <div className="behind">
        <div className="label">{behind}</div>
        <div className="bar" style={{ width: numberToUsefulLogPercentage(behind) }} />
      </div>
      <div className="ahead">
        <div className="label">{ahead}</div>
        <div className="bar" style={{ width: numberToUsefulLogPercentage(ahead) }} />
      </div>
    </div>
  )
}