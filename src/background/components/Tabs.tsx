import React, { useState } from 'react'

interface Tabs {
  [tab: string]: (tab: string) => JSX.Element
}

export default function Tabs(tabs: Tabs) {
  const [currentTab, setTab] = useState(Object.keys(tabs)[0])

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 10 }}>
        {Object.keys(tabs).map((tab) => (
          <div
            onClick={() => setTab(tab)}
            style={{
              padding: 8,
              border: '1px solid silver',
              marginRight: 8,
              color: tab === currentTab ? 'red' : 'black',
            }}
          >
            {tab}
          </div>
        ))}
      </div>
      <div>{tabs[currentTab](currentTab)}</div>
    </div>
  )
}
