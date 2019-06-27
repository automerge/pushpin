import React from 'react'
import Debug from 'debug'
import { ContextMenu, MenuItem as ContextMenuItem } from 'react-contextmenu'
import classNames from 'classnames'

import ColorPicker from '../ColorPicker'
import './ContextMenu.css'

const log = Debug('pushpin:board-context-menu')

interface Props {
  contentTypes: any[], // content-types isn't upgraded on my current branch
  addContent: (e, any) => void,
  onShowContextMenu: (e: Event) => void,
  backgroundColor: string,
  backgroundColors: string[],
  changeBackgroundColor: (color: string) => void
}

export default class BoardContextMenu extends React.PureComponent<Props> {
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
          {createMenuItems}
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
