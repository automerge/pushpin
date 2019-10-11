import React, { useState } from 'react'

interface Tabs {
  [tab: string]: (tab: string) => JSX.Element
}

export default function Tabs(tabs: Tabs) {
  const [currentTab, setTab] = useState(Object.keys(tabs)[0])

  return (
    <div>
      <div style={{ display: 'flex', marginTop: 10 }}>
        {Object.keys(tabs).map((tab) => {
          const isCurrent = tab === currentTab

          return (
            <div
              key={tab}
              onClick={() => setTab(tab)}
              style={{
                padding: 8,
                border: '1px solid silver',
                borderBottom: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
                marginLeft: 8,
                zIndex: isCurrent ? 2 : 0,
              }}
            >
              {tab}
            </div>
          )
        })}
      </div>
      <div
        style={{
          borderTop: '1px solid silver',
          padding: 10,
          marginTop: -1,
          zIndex: 1,
          position: 'relative',
        }}
      >
        {tabs[currentTab](currentTab)}
      </div>
    </div>
  )
}
