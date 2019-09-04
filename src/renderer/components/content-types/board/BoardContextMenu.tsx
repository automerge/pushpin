import React, { useRef, useState } from 'react'
import classNames from 'classnames'
import { ContextMenu, MenuItem as ContextMenuItem } from 'react-contextmenu'

import ColorPicker from '../../ColorPicker'
import './ContextMenu.css'
import ContentTypes, { LookupResult } from '../../../ContentTypes'
import { importFileList } from '../../../ImportData'
import { AddCardArgs } from './Board'
import { gridOffset, Position } from './BoardGrid'

interface Props {
  contentTypes: LookupResult[]
  backgroundColor: string
  backgroundColors: string[]
  addCardForContent(addArgs: AddCardArgs): void
  changeBackgroundColor(color: string): void
}

export default function BoardContextMenu(props: Props) {
  const [contextMenuPosition, setContextMenuPosition] = useState<Position>({ x: 0, y: 0 })

  const addContent = (e, contentType) => {
    e.stopPropagation()

    if (!contextMenuPosition) {
      return
    }

    const position = {
      x: contextMenuPosition.x, // - this.boardRef.current.getBoundingClientRect().left, // XXX TODO
      y: contextMenuPosition.y, //  - this.boardRef.current.getBoundingClientRect().top,
    }

    switch (contentType.type) {
      case 'board':
        ContentTypes.create(
          'board',
          {
            title: `Sub-board of ${'Untitled'}`, // xxx fixme
          },
          (url) => {
            props.addCardForContent({ position, url })
          }
        )
        break
      default:
        ContentTypes.create(contentType.type, {}, (url) => {
          props.addCardForContent({ position, url })
        })
    }
  }

  const createMenuItems = props.contentTypes.map((contentType) => (
    <ContextMenuItem key={contentType.type} onClick={(e) => addContent(e, contentType)}>
      <div className="ContextMenu__iconBounding ContextMenu__iconBounding--note">
        <i className={classNames('fa', `fa-${contentType.icon}`)} />
      </div>
      <span className="ContextMenu__label">{contentType.name}</span>
    </ContextMenuItem>
  ))

  const hiddenFileInput = useRef<HTMLInputElement>(null)
  const onImportClick = (e) => {
    if (hiddenFileInput.current) {
      hiddenFileInput.current.click()
    }
  }
  const onFilesChanged = (e) => {
    importFileList(e.target.files, (url, i) =>
      props.addCardForContent({ position: gridOffset(contextMenuPosition, i), url })
    )
  }

  const onShowContextMenu = (e) => {
    setContextMenuPosition({
      x: e.detail.position.x - e.detail.target.parentElement.offsetTop,
      y: e.detail.position.y - e.detail.target.parentElement.offsetLeft,
    })
  }

  return (
    <ContextMenu id="BoardMenu" onShow={onShowContextMenu} className="ContextMenu">
      <div className="ContextMenu__section">{createMenuItems}</div>

      <div className="ContextMenu__section">
        <div className="ContextMenu__divider" />
        <input
          type="file"
          id="hiddenImporter"
          multiple
          onChange={onFilesChanged}
          ref={hiddenFileInput}
          style={{ display: 'none' }}
        />
        <ContextMenuItem key="import" onClick={onImportClick}>
          <div className="ContextMenu__iconBounding ContextMenu__iconBounding--note">
            <i className={classNames('fa', `fa-download`)} />
          </div>
          <span className="ContextMenu__label">Import files...</span>
        </ContextMenuItem>
        <div className="ContextMenu__divider" />
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
