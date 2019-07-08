import React from 'react'
import Action from './Action'

export interface ActionItem {
  name: string
  label: string
  faIcon: string
  shortcut?: string
  destructive?: boolean
  callback(url: string): () => void
}

interface Props {
  url: string
  actions: ActionItem[]
  children?: React.ReactNode
}

/* This class is adapted from the react-color TwitterPicker
   by stripping out most of the functionality and just leaving swatches */
export default function Actions(props: Props) {
  function onActionClick(e: React.MouseEvent, callback: () => void) {
    e.stopPropagation()
    callback()
  }

  return (
    <div className="actions" style={css.actions}>
      {props.children}

      {props.actions.map((action) => (
        <Action
          key={action.name}
          callback={(e) => onActionClick(e, action.callback(props.url))}
          faIcon={action.faIcon}
          label={action.label}
          shortcut={action.shortcut}
          destructive={action.destructive}
        />
      ))}
    </div>
  )
}

const css: { [name: string]: React.CSSProperties } = {
  actions: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
  },
}
