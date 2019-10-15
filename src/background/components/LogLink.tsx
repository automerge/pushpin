import React, { Fragment } from 'react'

interface Props {
  v: any
  children?: React.ReactNode
}

export default function LogLink({ v, children }: Props) {
  function onClick(e: React.SyntheticEvent) {
    e.preventDefault()
    ;(window as any).temp = v
    console.log('temp =', v) // eslint-disable-line
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
