import React from 'react'
import PropTypes from 'prop-types'

export default class Contact extends React.PureComponent {
  static propTypes = {
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    actions: PropTypes.arrayOf(PropTypes.string),
    onShare: PropTypes.func,
    onUnshare: PropTypes.func
  }

  static defaultProps = {
    avatar: '',
    actions: [],
    onShare: () => {},
    onUnshare: () => {}
  }

  render() {
    const actions = []
    if (this.props.actions.includes('share')) {
      actions.push((
        <i
          role="button"
          key="share"
          className="fa fa-share-alt"
          onClick={this.props.onShare}
        />
      ))
    }

    if (this.props.actions.includes('unshare')) {
      actions.push((
        <i
          role="button"
          key="unshare"
          className="fa fa-ban"
          onClick={this.props.onUnshare}
        />
      ))
    }

    return (
      <div className="Contact">
        <div className="Contact__avatar"><img alt="avatar" src={this.props.avatar} /></div>
        <div className="Contact__info">
          <div className="Contact__info__name">
            { this.props.name }
          </div>
        </div>

        <div className="Contact__actions"> { actions } </div>
      </div>
    )
  }
}
