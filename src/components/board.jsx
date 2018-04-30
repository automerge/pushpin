import React from 'react'
import Jimp from 'jimp'
import { remote } from 'electron'
const { Menu, MenuItem, dialog } = remote
import Debug from 'debug'

import Loop from '../loop'
import Card from './card'
import * as Model from '../model'

const log = Debug('board')

// Test if a given x,y is within the bounds of a given card.
const withinCard = (card, x, y) => {
  return (x >= card.x) &&
         (x <= card.x + card.width) &&
         (y >= card.y) &&
         (y <= card.y + card.height)
}

// Test if a given x,y is within the bounds of any of the given cards.
const withinAnyCard = (cards, x, y) => {
  for (let id in cards) {
    if (withinCard(cards[id], x, y)) {
      return true
    }
  }
  return false
}

const boardStyle = {
  width: Model.BOARD_WIDTH,
  height: Model.BOARD_HEIGHT
}

class Board extends React.PureComponent {
  constructor(props) {
    super(props)
    log('constructor')

    this.onClick = this.onClick.bind(this)
    this.onDoubleClick = this.onDoubleClick.bind(this)
  }

  componentWillMount() {
    log('componentWillMount')
  }

  componentDidMount() {
    log('componentDidMount')
    // Note sure if this is the right place for these?
    document.addEventListener('keydown', this.onKeyDown)
    window.scrollTo((this.refs.board.clientWidth/2)-(window.innerWidth/2), 0)
  }
  
  componentWillReceiveProps(nextProps) {
    log('componentWillReceiveProps')
  }

  componentWillUpdate(nextProps) {
    log('componentWillUpdate')
  }

  componentDidUpdate() {
    log('componentDidUpdate')
  }

  onKeyDown(e) {
    if (e.key === 'Backspace') {
      Loop.dispatch(Model.boardBackspaced)
    }
  }

  // Clear selections when clicking on the board.
  onClick(e) {
    if (!withinAnyCard(this.props.cards, e.pageX, e.pageY)) {
      log('onClick')
      Loop.dispatch(Model.clearSelections)
    }
  }

  // Create a blank text card when double clicking.
  onDoubleClick(e) {
    if (!withinAnyCard(this.props.cards, e.pageX, e.pageY)) {
      log('onDoubleClick')
      Loop.dispatch(Model.cardCreatedText, { x: e.pageX, y: e.pageY, text: '', selected: true })
    }
  }

  // Show our own context menu.
  onContextMenu(e) {
    log('onContextMenu')
    e.preventDefault()
    const x = e.pageX
    const y = e.pageY
    const menu = new Menu()
    menu.append(new MenuItem({label: 'Add Note',  click() {
      Loop.dispatch(Model.cardCreatedText, { x, y, text: '', selected: true })
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
        Loop.dispatch(Model.processImage, { path, x, y, id: null })
      })
    }}))
    menu.popup({window: remote.getCurrentWindow()})
  }

  render() {
    log('render')
    let cardChildren = []
    for (let id in this.props.cards) {
      const card = this.props.cards[id]
      cardChildren.push(
        <Card
           key={id}
           card={card}
           selected={this.props.selected === id}
        />
      )
    }
    return (
      <div
        id='board'
        className='board'
        ref='board'
        style={boardStyle}
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        onContextMenu={this.onContextMenu}
      >
        {cardChildren}
      </div>
    )
  }
}

export default Board
