import React from 'react'
import { connect } from 'react-redux'
import Jimp from 'jimp'
import Card from './card'
import { remote } from 'electron'

import { CARD_CREATED_TEXT, CLEAR_SELECTIONS } from './action-types'
import { processImage, processPDF, BOARD_WIDTH, BOARD_HEIGHT } from './model'
import log from './log'

const { Menu, MenuItem, dialog } = remote

const presentation = ({ cards, selected, onClick, onDoubleClick, onContextMenu }) => {
  log('board.render')

  let cardChildren = []
  for (let id in cards) {
    const card = cards[id]
    cardChildren.push(<Card key={id} card={card} selected={selected === id}/>)
  }
  return (
    <div
      id='board'
      className='board'
      style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT}}
      onClick={(e) => { onClick(e, cards) }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}>
      {cardChildren}
    </div>
  )
}

const mapStateToProps = (state) => {
  if (!state.board || !state.board.cards) {
    return {cards: []}
  }
  return {cards: state.board.cards, selected: state.selected}
}

const rightClickMenu = (dispatch, e) => {
  const x = e.pageX
  const y = e.pageY
  const menu = new Menu()
  menu.append(new MenuItem({label: 'Add Note',  click() {
    dispatch({type: CARD_CREATED_TEXT, x: x, y: y, text: '', selected: true})
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

const withinCard = (card, x, y) => {
  return (x >= card.x) &&
         (x <= card.x + card.width) &&
         (y >= card.y) &&
         (y <= card.y + card.height)
}

const mapDispatchToProps = (dispatch, getState) => {
  return {
    onClick: (e, cards) => {
      let clickingInCard = false
      for (let id in cards) {
        const card = cards[id]
        const res = withinCard(card, e.pageX, e.pageY)
        if (res) {
          clickingInCard = true
          return
        }
      }
      if (clickingInCard) {
        return
      }
      log('board.onClick')
      dispatch({type: CLEAR_SELECTIONS})
    },
    onDoubleClick: (e) => {
      log('board.onDoubleClick')
      dispatch({type: CARD_CREATED_TEXT, x: e.pageX, y: e.pageY, text: '', selected: true})
    },
    onContextMenu: (e, ...rest) => {
      log('board.onContextMenu')
      e.preventDefault()
      const menu = rightClickMenu(dispatch, e)
      menu.popup({window: remote.getCurrentWindow()})
    }
  }
}

const Board = connect(mapStateToProps, mapDispatchToProps)(presentation)

export default Board
