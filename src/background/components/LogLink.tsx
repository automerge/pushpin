import React, { Fragment } from 'react'

interface Props {
  v: any
  children?: React.ReactNode
}

export default function LogLink({ v, children }: Props) {
  function onClick(e: React.SyntheticEvent) {
    e.preventDefault()
    log(v)
  }

  return (
    <Fragment>
      {children || null}
      <small>
        (
        <a href="#" onClick={onClick}>
          log
        </a>
        )
      </small>
    </Fragment>
  )
}

function log(v: any): boolean {
  if (typeof v === 'function') return log(v())
  if ('then' in v && typeof v.then === 'function') {
    v.then(log)
    return false
  }

  ;(window as any).temp = v
  console.log('temp =', v) // eslint-disable-line
  return true
}
