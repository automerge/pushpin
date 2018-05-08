import React from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'
import Debug from 'debug'

import Loop from '../loop'
import Card from './card'
import * as Model from '../model'

const { Menu, MenuItem, dialog } = remote

const log = Debug('pushpin:board')

const withinCard = (card, x, y) => (x >= card.x) &&
         (x <= card.x + card.width) &&
         (y >= card.y) &&
         (y <= card.y + card.height)

const withinAnyCard = (cards, x, y) =>
  Object.values(cards).some((card) => withinCard(card, x, y))

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
    this.onContextMenu = this.onContextMenu.bind(this)
  }

  componentDidMount() {
    log('componentDidMount')
    document.addEventListener('keydown', this.onKeyDown)
    window.scrollTo((this.boardRef.clientWidth / 2) - (window.innerWidth / 2), 0)
  }

  componentWillUnmount() {
    log('componentWillUnmount')
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onKeyDown(e) {
    if (e.key === 'Backspace') {
      Loop.dispatch(Model.boardBackspaced)
    }
  }

  onClick(e) {
    if (!withinAnyCard(this.props.cards, e.pageX, e.pageY)) {
      log('onClick')
      Loop.dispatch(Model.clearSelections)
    }
  }

  onDoubleClick(e) {
    if (!withinAnyCard(this.props.cards, e.pageX, e.pageY)) {
      log('onDoubleClick')
      Loop.dispatch(Model.cardCreatedText, { x: e.pageX, y: e.pageY, text: '', selected: true })
    }
  }

  onContextMenu(e) {
    log('onContextMenu')
    e.preventDefault()
    const x = e.pageX
    const y = e.pageY
    const menu = new Menu()
    menu.append(new MenuItem({ label: 'Add Note',
      click() {
        Loop.dispatch(Model.cardCreatedText, { x, y, text: '', selected: true })
      } }))
    menu.append(new MenuItem({ label: 'Add Image',
      click() {
        dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
        }, (paths) => {
          // User aborted.
          if (!paths) {
            return
          }
          if (paths.length !== 1) {
            throw new Error('Expected exactly one path?')
          }
          const path = paths[0]
          Loop.dispatch(Model.processImage, { path, x, y })
        })
      } }))
    menu.popup({ window: remote.getCurrentWindow() })
  }

  render() {
    log('render')

    const cardChildren = Object.entries(this.props.cards).map(([id, card]) =>
      <Card key={id} card={card} selected={this.props.selected === id} />)

    return (
      <div
        id="board"
        className="board"
        ref={(e) => { this.boardRef = e }}
        style={boardStyle}
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        onContextMenu={this.onContextMenu}
        role="presentation"
      >
        {cardChildren}
      </div>
    )
  }
}

Board.propTypes = {
  selected: PropTypes.string,
  cards: PropTypes.shape(PropTypes.objectOf(Card.propTypes)).isRequired,
}

export default Board
