
import React from 'react'
import PropTypes from 'prop-types'
import Action from './action'

/* This class is adapted from the react-color TwitterPicker
   by stripping out most of the functionality and just leaving swatches */
export default class Actions extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node,
    actions: PropTypes.arrayOf(PropTypes.any),
    url: PropTypes.string.isRequired
  }

  static defaultProps = {
    children: null,
    actions: []
  }

  onActionClick = (e, callback) => {
    e.stopPropagation()
    callback()
  }

  render = () => {
    const { url, actions } = this.props

    const result = (
      <div
        className="actions"
        style={css.actions}
      >
        {this.props.children}
        {actions.map((elt) => (
          <Action
            key={elt.name}
            callback={(e) => this.onActionClick(e, elt.callback(url))}
            faIcon={elt.faIcon}
            label={elt.label}
            shortcut={elt.shortcut}
            destructive={elt.destructive}
          />
        ))}
      </div>
    )
    return result
  }
}

const css = {
  actions: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row'
  }
}
