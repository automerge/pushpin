import React from 'react'
import PropTypes from 'prop-types'

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
      className={`ButtonAction ${
        (props.destructive
          ? 'ButtonAction-destructive'
          : 'ButtonAction--primary')
        }`}
    >
      <i className={`fa ${props.faIcon}`} />
      <div
        className="ButtonAction__label Type--secondary"
      >
        {props.label}
        <br />
        {props.shortcut}
      </div>
    </div>
  )
}

Action.defaultProps = {
  destructive: false,
  shortcut: ''
}
