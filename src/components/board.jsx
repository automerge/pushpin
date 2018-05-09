import React from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'
import Debug from 'debug'
import { ContextMenu, MenuItem as ContextMenuItem, ContextMenuTrigger } from 'react-contextmenu'

import Loop from '../loop'
import Card from './card'
import * as Model from '../model'

const { Menu, MenuItem, dialog } = remote

const log = Debug('pushpin:board')
const BOARD_MENU_ID = 'BoardMenu'

const dialogOptions = {
  properties: ['openFile'],
  filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
}

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

export default class Board extends React.PureComponent {
  static defaultProps = {
    backgroundColor: '',
    selected: null
  }

  static propTypes = {
    backgroundColor: PropTypes.string,
    selected: PropTypes.string,
    cards: PropTypes.shape(PropTypes.objectOf(Card.propTypes)).isRequired,
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.onClick = this.onClick.bind(this)
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.onAddNote = this.onAddNote.bind(this)
    this.onAddImage = this.onAddImage.bind(this)
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

  onAddNote(e) {
    const x = e.pageX
    const y = e.pageY
    Loop.dispatch(Model.cardCreatedText, { x, y, text: '', selected: true })
  }

  onAddImage(e) {
    const x = e.pageX
    const y = e.pageY
    dialog.showOpenDialog(dialogOptions, (paths) => {
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
  }

  render() {
    log('render')

    const cardChildren = Object.entries(this.props.cards).map(([id, card]) =>
      <Card key={id} card={card} selected={this.props.selected === id} />)

    const contextMenu = (
      <ContextMenu id={BOARD_MENU_ID} className="ContextMenu">
        <ContextMenuItem onClick={this.onAddNote}>
          <div className="ContextMenu__iconBounding ContextMenu__iconBounding--note">
            <i className="fa fa-sticky-note" />
          </div>
          <span className="ContextMenu__label"> Note </span>
        </ContextMenuItem>

        <ContextMenuItem onClick={this.onAddImage}>
          <div className="ContextMenu__iconBounding ContextMenu__iconBounding--file">
            <i className="fa fa-folder-open" />
          </div>
          <span className="ContextMenu__label"> Choose image from file... </span>
        </ContextMenuItem>
      </ContextMenu>
    )

    return (
      <div>
        { contextMenu }
        <ContextMenuTrigger id={BOARD_MENU_ID}>
          <div
            id="board"
            className="board"
            ref={(e) => { this.boardRef = e }}
            style={{ ...boardStyle, backgroundColor: this.props.backgroundColor }}
            onClick={this.onClick}
            onDoubleClick={this.onDoubleClick}
            role="presentation"
          >
            {cardChildren}
          </div>
        </ContextMenuTrigger>
      </div>
    )
  }
}
