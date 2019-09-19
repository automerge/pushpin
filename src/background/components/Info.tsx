import React from 'react'

interface Props {
  [name: string]: string
}

export default function Info(info: Props) {
  return (
    <code
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gridGap: '0 5px',
        whiteSpace: 'pre-wrap',
      }}
    >
      {Object.keys(info).map((k) => (
        <>
          <div>{k}:</div>
          <div>{info[k]}</div>
        </>
      ))}
    </code>
  )
}
