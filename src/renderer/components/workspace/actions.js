
import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import Action from './action'

const log = Debug('pushpin:actions')

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

  render = () => {
    log('actions', this.props.actions)
    const { url, actions } = this.props

    const first = actions[0]

    const result = (
      <div
        className={`actions ${first ? 'Actions__withDefault' : ''}`}
        style={css.actions}
        onClick={first ? first.callback(url) : null}
      >
        {this.props.children}
        {actions.map((elt) => (
          <Action
            key={elt.name}
            callback={elt.callback(url)}
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
