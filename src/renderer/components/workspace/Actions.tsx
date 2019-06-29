
import React from 'react'
import Action from './Action'

export interface ActionItem {
  name: string
  label: string
  faIcon: string
  shortcut: string
  destructive: boolean
  callback(url: string): () => void
}

interface Props {
  url: string
  actions: ActionItem[]
}

/* This class is adapted from the react-color TwitterPicker
   by stripping out most of the functionality and just leaving swatches */
export default class Actions extends React.PureComponent<Props> {
  onActionClick = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation()
    callback()
  }

  render() {
    const { url, actions } = this.props

    const result = (
      <div className="actions" style={css.actions}>
        {this.props.children}

        {actions.map(action => (
          <Action
            key={action.name}
            callback={e => this.onActionClick(e, action.callback(url))}
            faIcon={action.faIcon}
            label={action.label}
            shortcut={action.shortcut}
            destructive={action.destructive}
          />
        ))}
      </div>
    )
    return result
  }
}

const css: { [name: string]: React.CSSProperties } = {
  actions: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row'
  }
}
