import React from 'react'
import LogLink from './LogLink'

type Value = string | number | boolean | React.ReactElement | object | null | undefined | ValueArray
interface ValueArray extends Array<Value> {}

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

export function hidden(summary: Value, details: Value): Value {
  return (
    <details>
      <summary>{renderValue(summary)}</summary>
      {renderValue(details)}
    </details>
  )
}

function renderValue(v: Value) {
  if (v == null) return ''
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (React.isValidElement(v)) return v
  if (Array.isArray(v))
    return (
      <>
        {v.map((v2, i) => (
          <div key={String(i)}>{renderValue(v2)}</div>
        ))}
      </>
    )
  if (typeof v === 'object') return <Info {...v} />

  return String(v)
}
