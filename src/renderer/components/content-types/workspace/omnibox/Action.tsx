import React from 'react'
import SecondaryText from '../../../ui/SecondaryText'
import './Action.css'

interface Props {
  callback(e: React.MouseEvent): void
  destructive?: boolean
  faIcon: string
  label: string
  shortcut?: string
}

export default function Action(props: Props) {
  return (
    <div
      role="button"
      onClick={props.callback}
      className={`Action ${props.destructive ? 'Action--destructive' : 'Action--primary'}`}
    >
      <span className="Action-icon">
        <i className={`fa ${props.faIcon}`} />
      </span>
      <div className="Action-label">
        <SecondaryText style={{ color: 'inherit' }}>
          {props.label}
          <br />
          {props.shortcut}
        </SecondaryText>
      </div>
    </div>
  )
}

Action.defaultProps = {
  destructive: false,
  shortcut: '',
}
