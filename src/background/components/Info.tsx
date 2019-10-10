import React from 'react'
import LogLink from './LogLink'

type Value = string | number | boolean | React.ReactElement | object | null | undefined

interface Props {
  log?: any
  [name: string]: Value
}

export default function Info({ log, ...info }: Props) {
  return (
    <code
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gridGap: '0 5px',
        whiteSpace: 'pre-wrap',
        position: 'relative',
      }}
    >
      {log ? (
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <LogLink v={log} />
        </div>
      ) : null}
      {Object.keys(info).map((k) => (
        <React.Fragment key={k}>
          <div>{k}:</div>
          <div>{renderValue(info[k])}</div>
        </React.Fragment>
      ))}
    </code>
  )
}

function renderValue(v: Value) {
  if (v == null) return ''
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (React.isValidElement(v)) return v
  if (typeof v === 'object') return <Info {...v} />

  return String(v)
}
