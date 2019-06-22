import React from 'react'
import PropTypes from 'prop-types'

import Content from '../content'
import Actions from './actions'


// TODO: item highlighting
export default class ListItem extends React.PureComponent {
  static propTypes = {
    contentUrl: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PropTypes.any),
    selected: PropTypes.bool
  }

  static defaultProps = {
    actions: [],
    selected: false
  }

  get defaultAction() {
    return this.props.actions[0] && this.props.actions[0].callback
  }

  onClick = () => {
    console.log('on click') //eslint-disable-line
    if (this.defaultAction) {
      this.defaultAction(this.props.contentUrl)()
    }
  }

  render = () => {
    const { contentUrl, actions, selected } = this.props
    const classes = [
      'OmniItem',
      this.defaultAction ? 'OmniItem--withDefaultAction' : '',
      selected ? 'OmniItem--selected' : ''
    ].join(' ')
    return (
      <div className={classes} onClick={this.onClick}>
        <div className="OmniItem-content">
          <Content context="list" url={contentUrl} />
        </div>
        <div className="OmniItem-actions">
          <Actions url={contentUrl} actions={actions} />
        </div>
      </div>
    )
  }
}
