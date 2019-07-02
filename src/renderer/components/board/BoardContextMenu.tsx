import React from 'react'
import { ContextMenu, MenuItem as ContextMenuItem } from 'react-contextmenu'
import classNames from 'classnames'

import ColorPicker from '../ColorPicker'
import './ContextMenu.css'
import { LookupResult } from '../../ContentTypes'

interface Props {
  contentTypes: LookupResult[],
  backgroundColor: string,
  backgroundColors: string[],
  addContent(e: React.MouseEvent | React.TouchEvent, contentType: LookupResult): void,
  onShowContextMenu(e: Event): void,
  changeBackgroundColor(color: string): void
}

export default function BoardContextMenu(props: Props) {
  const createMenuItems = props.contentTypes.map((contentType) => (
    <ContextMenuItem
      key={contentType.type}
      onClick={(e) => props.addContent(e, contentType)}
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
      onShow={props.onShowContextMenu}
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
            color={props.backgroundColor}
            colors={props.backgroundColors}
            onChangeComplete={props.changeBackgroundColor}
          />
        </ContextMenuItem>
      </div>
    </ContextMenu>
  )
}
