import React from 'react'
import LogLink from './LogLink'
import Expandable from './Expandable'
import './Info.css'

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
  return renderInfo(info, log)
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

export function hidden(summary: string, details: () => Value): Value {
  return <Expandable summary={summary}>{() => <>{renderValue(details())}</>}</Expandable>
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`
}

export function hiddenList<T>(
  items: Iterable<T>,
  singular: string,
  mapItem: (item: T) => Value
): Value {
  const itemsArray = Array.from(items)
  return hidden(`${pluralize(itemsArray.length, singular)}...`, () => itemsArray.map(mapItem))
}

function renderInfo(info: any, log?: any) {
  const keys = Object.keys(info)

  if (keys.length === 0) return null

  return (
    <code className="Info">
      {log ? (
        <div className="Info_Log">
          <div className="Info_Log_Inner">
            <LogLink v={log} />
          </div>
        </div>
      ) : null}

      {keys.map((k) => (
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
  if (Array.isArray(v)) return renderInfo(v)
  if (v instanceof Uint8Array) return hexDump(v)
  if (typeof v === 'object') return renderInfo(v)

  return String(v)
}
