
import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

const log = Debug('pushpin:actions')

/* This class is adapted from the react-color TwitterPicker
   by stripping out most of the functionality and just leaving swatches */
export default class Actions extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node,
    actions: PropTypes.objectOf(PropTypes.func),
    url: PropTypes.string.isRequired
  }

  static defaultProps = {
    children: null,
    actions: {}
  }

  render = () => {
    log('actions', this.props.actions)
    const { url } = this.props
    const { share, unshare, archive, unarchive, view, invite } = this.props.actions

    const data = []
    if (share) {
      data.push({ name: 'share',
        callback: share,
        faIcon: 'fa-share-alt',
        label: 'Share' })
    }

    if (unshare) {
      data.push({ name: 'unshare',
        destructive: true,
        callback: unshare,
        faIcon: 'fa-ban',
        label: 'Unshare' })
    }

    if (archive) {
      data.push({ name: 'archive',
        destructive: true,
        callback: view,
        faIcon: 'fa-trash',
        label: 'Archive',
        shortcut: '⌘+⌫' })
    }

    if (unarchive) {
      data.push({ name: 'unarchive',
        callback: view,
        faIcon: 'fa-trash-restore',
        label: 'Unarchive',
        shortcut: '⌘+⌫' })
    }

    if (view) {
      data.push({ name: 'view',
        callback: view,
        faIcon: 'fa-compass',
        label: 'View',
        shortcut: '⏎' })
    }

    if (invite) {
      data.push({ name: 'invite',
        callback: invite,
        faIcon: 'fa-compass',
        label: 'Invite',
        shortcut: '⏎' })
    }

    const actions = data.map((elt) =>
      (
        <div
          role="button"
          key={elt.name}
          onClick={elt.callback(url)}
          className={`ButtonAction ${
            (elt.destructive
              ? 'ButtonAction-destructive'
              : 'ButtonAction--primary')
          }`}
        >
          <i className={`fa ${elt.faIcon}`} />
          <div
            key="archive"
            className="ButtonAction__label Type--secondary"
          >
            {elt.label}
            <br />
            {elt.shortcut}
          </div>
        </div>
      ))

    const result = (
      <div
        className={`actions ${view ? 'Actions__withDefault' : ''}`}
        style={css.actions}
        onClick={view ? view(url) : null}
      >
        {this.props.children}
        {actions}
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
