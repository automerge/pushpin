import React from 'react'
import LogLink from './LogLink'
import Expandable from './Expandable'

type Value =
  | string
  | number
  | boolean
  | React.ReactElement
  | object
  | null
  | undefined
  | ValueArray
  | Uint8Array
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
        <div style={{ position: 'absolute', top: 0, right: 0, height: '100%' }}>
          <div style={{ position: 'sticky', top: 10 }}>
            <LogLink v={log} />
          </div>
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

const mags = ['', 'KB', 'MB', 'GB']
export function humanBytes(n?: number): string {
  if (n == null) return 'N/A'

  let mag = 0
  while (n > 1024) {
    n /= 1024
    mag += 1
  }
  n = Math.round(n * 100) / 100
  return `${n} ${mags[mag]}`
}

export function humanNumber(n: number): string {
  return n.toLocaleString()
}

export function hexDump(buffer: Uint8Array, blockSize = 16) {
  const lines: string[] = []
  const hex = '0123456789ABCDEF'

  for (let b = 0; b < buffer.length; b += blockSize) {
    const block = buffer.slice(b, b + blockSize)
    const addr = `0000${b.toString(16)}`.slice(-4)

    let codes = Array.from(block)
      .map((code) => ` ${hex[(0xf0 & code) >> 4]}${hex[0x0f & code]}`) // eslint-disable-line
      .join('')

    codes += '   '.repeat(blockSize - block.length)

    let chars = block.toString().replace(/[^\w-~,<>\/\\\[\]{}*&^%$#@!'":;]/gi, '.') // eslint-disable-line
    chars += ' '.repeat(blockSize - block.length)
    lines.push(`${addr} ${codes}  ${chars}`)
  }
  return lines.join('\n')
}

export function hidden(summary: Value, details: () => Value): Value {
  return (
    <Expandable summary={renderValue(summary)}>{() => <>{renderValue(details())}</>}</Expandable>
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
          <Info key={String(i)} {...{ [i]: renderValue(v2) }} />
        ))}
      </>
    )
  if (v instanceof Uint8Array) return hexDump(v)
  if (typeof v === 'object') return <Info {...v} />

  return String(v)
}
