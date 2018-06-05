import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../content-types'
import Content from './content'
import { shareLinkForDocument } from '../share-link';

export default class Contact extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      avatarDocId: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    actions: PropTypes.arrayOf(PropTypes.string),
    onShare: PropTypes.func,
    onUnshare: PropTypes.func
  }

  static defaultProps = {
    actions: [],
    onShare: () => {},
    onUnshare: () => {}
  }

  render() {
    const actions = []
    if (this.props.actions.includes('share')) {
      actions.push((
        <div role="button" key="share" onClick={this.props.onShare} className="ButtonAction ButtonAction--primary">
          <i className="fa fa-share-alt" />
        </div>
      ))
    }

    if (this.props.actions.includes('unshare')) {
      actions.push((
        <div role="button" key="unshare" onClick={this.props.onUnshare} className="ButtonAction ButtonAction--destructive">
          <i className="fa fa-ban" />
        </div>
      ))
    }

    let avatar
    if (this.props.doc.avatarDocId) {
      avatar = <Content url={shareLinkForDocument('image', this.props.doc.avatarDocId)} />
    } else {
      avatar = <img alt="avatar" src="../img/default-avatar.png" />
    }

    return (
      <div className="ListMenu__item">
        <div className="ListMenu__thumbnail">
          <div className="Avatar">
            { avatar }
          </div>
        </div>
        <div className="Label">
          <p className="Type--primary">
            { this.props.doc.name }
          </p>
        </div>

        <div className="Actions"> { actions } </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: Contact,
  type: 'contact',
  name: 'Contact',
  icon: 'sticky-note',
  unlisted: true,
})
