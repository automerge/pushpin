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
    avatar: '../img/default-avatar.png',
    actions: [],
    onShare: () => {},
    onUnshare: () => {}
  }

  render() {
    const actions = []
    if (this.props.actions.includes('share')) {
      actions.push((
        <div role="button" key="share" onClick={this.props.onShare} className="ButtonAction ButtonAction--primary">
          <i className="fa fa-share-alt"/>
        </div>
      ))
    }

    if (this.props.actions.includes('unshare')) {
      actions.push((
        <div role="button" key="unshare" onClick={this.props.onUnshare} className="ButtonAction ButtonAction--destructive">
          <i className="fa fa-ban"/>
        </div>
      ))
    }

    return (
      <div className="ListMenu__item">
        <div className="ListMenu__thumbnail">
          <div className="Avatar">
            <img alt="avatar" src={this.props.avatar} />
          </div>
        </div>
        <div className="Label">
          <p className="Type--primary">
            { this.props.name }
          </p>
        </div>

        <div className="Actions"> { actions } </div>
      </div>
    )
  }
}
