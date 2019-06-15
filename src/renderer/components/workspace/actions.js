
import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

const log = Debug('pushpin:actions')

/* This class is adapted from the react-color TwitterPicker
   by stripping out most of the functionality and just leaving swatches */
export default class Actions extends React.PureComponent {
  static propTypes = {
    actions: PropTypes.objectOf(PropTypes.func),
    url: PropTypes.string.isRequired
  }

  static defaultProps = {
    actions: {}
  }

  render = () => {
    log('actions', this.props.actions)
    const { url } = this.props
    const { share, unshare, archive, unarchive, view, invite } = this.props.actions
    const actions = []

    if (share) {
      actions.push((
        <div
          role="button"
          key="share"
          onClick={share(url)}
          className="ButtonAction ButtonAction--primary"
        >
          <i className="fa fa-share-alt" />
          <div
            key="archive"
            className="ButtonAction__label Type--secondary"
            onClick={share(url)}
          >Share
          </div>
        </div>
      ))
    }

    if (unshare) {
      actions.push((
        <div
          role="button"
          key="unshare"
          onClick={unshare(url)}
          className="ButtonAction ButtonAction--destructive"
        >
          <i className="fa fa-ban" />
          <div
            key="archive"
            className="ButtonAction__label Type--secondary"
            onClick={unshare(url)}
          >Unshare
          </div>
        </div>
      ))
    }

    if (archive) {
      actions.push(
        <div
          role="button"
          key="archive"
          onClick={archive(url)}
          className="ButtonAction ButtonAction--destructive"
        >
          <i className="fa fa-trash" />
          <div
            key="archive"
            className="ButtonAction__label Type--secondary"
            onClick={archive(url)}
          >Archive<br />⌘+⌫
          </div>
        </div>
      )
    }

    if (unarchive) {
      actions.push(
        <div
          role="button"
          key="unarchive"
          onClick={unarchive(url)}
          className="ButtonAction"
        >
          <i className="fa fa-trash-restore" />
          <div
            key="archive"
            className="ButtonAction__label Type--secondary"
            onClick={unarchive(url)}
          >Unarchive<br />⌘+⌫
          </div>
        </div>
      )
    }

    if (view) {
      actions.push(
        <div
          role="button"
          key="view"
          onClick={view(url)}
          className="ButtonAction"
        >
          <i className="fa fa-compass" />
          <div
            key="view"
            className="ButtonAction__label Type--secondary"
            onClick={view(url)}
          >View<br />⏎
          </div>
        </div>
      )
    }

    if (invite) {
      actions.push(
        <span
          key="invite"
          onClick={invite(url)}
          className="Type--secondary"
        >⏎ Invite
        </span>
      )
    }

    const result = <div className="actions" style={css.actions}>{actions}</div>
    return result
  }
}

const css = {
  actions: {
    display: 'flex',
    flexDirection: 'row'
  }
}
