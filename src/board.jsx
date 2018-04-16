import React from 'react'
import { connect } from 'react-redux'
import Jimp from 'jimp'
import Card from './card'
import { remote } from 'electron'

import { CARD_CREATED_TEXT, CLEAR_SELECTIONS } from './action-types'
import { processImage, processPDF } from './model'

const { Menu, MenuItem, dialog } = remote

const presentation = ({ cards, onClick, onDoubleClick, onContextMenu }) => {
  return (
  <div
    className='board'
    onClick={onClick}
    onDoubleClick={onDoubleClick}
    onContextMenu={onContextMenu}>
    {cards.valueSeq().map(card =>
      <Card
        key={card.get('id')}
        card={card}
      />
    )}
  </div>
  )
}

const mapStateToProps = (state) => {
  return {cards: state.get('cards')}
}

const rightClickMenu = (dispatch, e) => {
  const x = e.pageX
  const y = e.pageY
  const menu = new Menu()
  menu.append(new MenuItem({label: 'Add Note',  click() {
    dispatch({type: CLEAR_SELECTIONS})
    dispatch({type: CARD_CREATED_TEXT, x: x, y: y, selected: true})
  }}))
  menu.append(new MenuItem({label: 'Add Image', click() {
    dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif']}]
    }, (paths) => {
      if (paths.length !== 1) {
        return
      }
      const path = paths[0]
      processImage(dispatch, path, null, x, y)
      }
    )
  }}))
  menu.append(new MenuItem({label: 'Add PDF', click() {
    dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{name: 'PDFs', extensions: ['pdf']}]
    }, (paths) => {
      if (paths.length !== 1) {
        return
      }
      const path = paths[0]
      processPDF(dispatch, path, null, x, y)
      }
    )
  }}))
  return menu
}

const mapDispatchToProps = (dispatch) => {
  return {
    onClick: (e) => {
      dispatch({type: CLEAR_SELECTIONS})
    },
    onDoubleClick: (e) => {
      dispatch({type: CLEAR_SELECTIONS})
      dispatch({type: CARD_CREATED_TEXT, x: e.pageX, y: e.pageY, selected: true})
    },
    onContextMenu: (e, ...rest) => {
      e.preventDefault()
      const menu = rightClickMenu(dispatch, e)
      menu.popup({window: remote.getCurrentWindow()})
    }
  }
}

const Board = connect(mapStateToProps, mapDispatchToProps)(presentation)

export default Board
