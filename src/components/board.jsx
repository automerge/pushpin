import React from 'react';
import { connect } from 'react-redux';
import Jimp from 'jimp';
import { remote } from 'electron';
import Debug from 'debug';
import Card from './card';

import { CARD_CREATED_TEXT, CLEAR_SELECTIONS } from '../action-types';
import { processImage, BOARD_WIDTH, BOARD_HEIGHT } from '../model';

const { Menu, MenuItem, dialog } = remote;

const log = Debug('pushpin:board');

const withinCard = (card, x, y) => {
  return (x >= card.x) &&
         (x <= card.x + card.width) &&
         (y >= card.y) &&
         (y <= card.y + card.height)
}

const withinAnyCard = (cards, x, y) => {
  for (let id in cards) {
    const card = cards[id]
    if (withinCard(card, x, y)) {
      return true
    }
  }
  return false
}

const boardStyle = {
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT
}

class BoardPresentation extends React.PureComponent {
  constructor(props) {
    super(props)
    log('constructor')

    this.onClick = this.onClick.bind(this)
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
  }

  onClick(e) {
    if (!withinAnyCard(this.props.cards, e.pageX, e.pageY)) {
      log('onClick')
      this.props.dispatch({type: CLEAR_SELECTIONS})
    }
  }

  onDoubleClick(e) {
    if (!withinAnyCard(this.props.cards, e.pageX, e.pageY)) {
      log('onDoubleClick')
      this.props.dispatch({type: CARD_CREATED_TEXT, x: e.pageX, y: e.pageY, text: '', selected: true})
    }
  }

  onContextMenu(e) {
    log('onContextMenu')
    e.preventDefault()
    const x = e.pageX
    const y = e.pageY
    const menu = new Menu()
    const dispatch = this.props.dispatch
    menu.append(new MenuItem({label: 'Add Note',  click() {
      dispatch({type: CARD_CREATED_TEXT, x: x, y: y, text: '', selected: true})
    }}))
    menu.append(new MenuItem({label: 'Add Image', click() {
      dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif']}]
      }, (paths) => {
        // User aborted.
        if (!paths) {
          return
        }
        if (paths.length !== 1) {
          throw new Error('Expected exactly one path?')
        }
        const path = paths[0]
        processImage(dispatch, path, x, y)
      })
    }}))
    menu.popup({window: remote.getCurrentWindow()})
  }

  render() {
    log('render')

    let cardChildren = []
    for (let id in this.props.cards) {
      const card = this.props.cards[id]
      cardChildren.push(<Card key={id} card={card} selected={this.props.selected === id}/>)
    }

    return (
      <div
        id='board'
        className='board'
        style={boardStyle}
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        onContextMenu={this.onContextMenu}>
        {cardChildren}
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  if (!state.board || !state.board.cards) {
    return {cards: []}
  }
  return {cards: state.board.cards, selected: state.selected}
}

const mapDispatchToProps = (dispatch) => {
  return { dispatch }
}

const Board = connect(mapStateToProps, mapDispatchToProps)(BoardPresentation)

export default Board;
