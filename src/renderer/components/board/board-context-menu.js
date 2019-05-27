import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { ContextMenu, MenuItem as ContextMenuItem } from 'react-contextmenu'
import classNames from 'classnames'

import ColorPicker from '../color-picker'

const log = Debug('pushpin:board-context-menu')

export default class BoardContextMenu extends React.PureComponent {
  static propTypes = {
    contentTypes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    addContent: PropTypes.func.isRequired,
    onShowContextMenu: PropTypes.func.isRequired,
    backgroundColor: PropTypes.string.isRequired,
    backgroundColors: PropTypes.arrayOf(PropTypes.string).isRequired,
    changeBackgroundColor: PropTypes.func.isRequired
  }

  render = () => {
    log('render')

    const createMenuItems = this.props.contentTypes.map((contentType) => (
      <ContextMenuItem
        key={contentType.type}
        onClick={(e) => { this.props.addContent(e, contentType) }}
      >
        <div className="ContextMenu__iconBounding ContextMenu__iconBounding--note">
          <i className={classNames('fa', `fa-${contentType.icon}`)} />
        </div>
        <span className="ContextMenu__label">{contentType.name}</span>
      </ContextMenuItem>
    ))

    return (
      <ContextMenu
        id="BoardMenu"
        onShow={this.props.onShowContextMenu}
        className="ContextMenu"
      >
        <div className="ContextMenu__section">
          { createMenuItems }
        </div>
        <div className="ContextMenu__section">
          <h6>Board Color</h6>
          <div className="ContextMenu__divider" />
          <ContextMenuItem>
            <ColorPicker
              color={this.props.backgroundColor}
              colors={this.props.backgroundColors}
              onChangeComplete={this.props.changeBackgroundColor}
            />
          </ContextMenuItem>
        </div>
      </ContextMenu>
    )
  }
}
