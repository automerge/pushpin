import React from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'
import Debug from 'debug'
import { ContextMenu, MenuItem as ContextMenuItem, ContextMenuTrigger } from 'react-contextmenu'

import Loop from '../loop'
import Card from './card'
import * as Model from '../model'
import ColorPicker from './color-picker'

const { dialog } = remote

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
    selected: []
  }

  static propTypes = {
    backgroundColor: PropTypes.string,
    selected: PropTypes.arrayOf(PropTypes.string),
    cards: PropTypes.objectOf(Card.propTypes.card).isRequired,
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.onClick = this.onClick.bind(this)
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.onPaste = this.onPaste.bind(this)

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

  onDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  getFiles(dataTransfer) {
    const files = []
    for (let i = 0; i < dataTransfer.files.length; i += 1) {
      const item = dataTransfer.items[i]
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          files.push(file)
        }
      }
    }

    return files
  }

  async onDrop(e) {
    log('onDrop')
    e.preventDefault()
    e.stopPropagation()

    /* Adapted from:
      https://www.meziantou.net/2017/09/04/upload-files-and-directories-using-an-input-drag-and-drop-or-copy-and-paste-with */
    const { length } = e.dataTransfer.files
    for (let i = 0; i < length; i += 1) {
      const entry = e.dataTransfer.files[i]

      if (entry.type.match('image/')) {
        const reader = new FileReader()

        const { pageX, pageY } = e

        reader.onload = () =>
          Loop.dispatch(Model.processImage, {
            path: entry.name,
            buffer: Buffer.from(reader.result),
            x: pageX + (i * (Model.GRID_SIZE * 2)),
            y: pageY + (i * (Model.GRID_SIZE * 2)) })

        reader.readAsArrayBuffer(entry)
      } else if (entry.type.match('text/')) {
        const reader = new FileReader()

        const { pageX, pageY } = e

        reader.onload = () =>
          Loop.dispatch(Model.cardCreatedText, {
            text: reader.result,
            x: pageX + (i * (Model.GRID_SIZE * 2)),
            y: pageY + (i * (Model.GRID_SIZE * 2)) })

        reader.readAsText(entry)
      }
    }
  }

  // TODO: X/Y positions
  async onPaste(e) {
    log('onPaste')
    e.preventDefault()
    e.stopPropagation()

    const dataTransfer = e.clipboardData

    if (dataTransfer.files.length > 0) {
      Array.from(dataTransfer.files).forEach((file) => {
        // make sure we have an image
        if (!file.type.match('image/')) {
          log(`we had a pasted file that was a ${file.type} not an image`)
          return
        }

        const reader = new FileReader()
        reader.onload = () =>
          Loop.dispatch(Model.processImage, {
            path: file.name,
            buffer: Buffer.from(reader.result),
            x: 100,
            y: 100 })
        reader.readAsArrayBuffer(file)
      })
    }

    const plainTextData = dataTransfer.getData('text/plain')
    if (plainTextData) {
      Loop.dispatch(Model.cardCreatedText, {
        text: plainTextData,
        x: 100,
        y: 100 })
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

  onChangeBoardBackgroundColor(color) {
    log('onChangeBoardBackgroundColor')
    Loop.dispatch(Model.setBackgroundColor, { backgroundColor: color.hex })
  }

  render() {
    log('render')

    // rework selected functioning, this is a slow implementation
    const cardChildren = Object.entries(this.props.cards).map(([id, card]) => {
      const selected = this.props.selected.includes(id)
      const uniquelySelected = selected && this.props.selected.length === 1
      return <Card key={id} card={card} selected={selected} uniquelySelected={uniquelySelected} />
    })

    const contextMenu = (
      <ContextMenu id={BOARD_MENU_ID} className="ContextMenu">
        <div className="ContextMenu__section">
          <ContextMenuItem onClick={this.onAddNote}>
            <div className="ContextMenu__iconBounding ContextMenu__iconBounding--note">
              <i className="fa fa-sticky-note" />
            </div>
            <span className="ContextMenu__label">Note</span>
          </ContextMenuItem>

          <ContextMenuItem onClick={this.onAddImage}>
            <div className="ContextMenu__iconBounding ContextMenu__iconBounding--file">
              <i className="fa fa-folder-open" />
            </div>
            <span className="ContextMenu__label">Choose image from file...</span>
          </ContextMenuItem>
        </div>

        <div className="ContextMenu__divider" />

        <div className="ContextMenu__section">
          <ContextMenuItem>
            <ColorPicker
              color={this.props.backgroundColor}
              colors={Object.values(Model.BOARD_COLORS)}
              onChangeComplete={this.onChangeBoardBackgroundColor}
            />
          </ContextMenuItem>
        </div>
      </ContextMenu>
    )

    return (
      <div>
        { contextMenu }
        <ContextMenuTrigger holdToDisplay={-1} id={BOARD_MENU_ID}>
          <div
            id="board"
            className="board"
            ref={(e) => { this.boardRef = e }}
            style={{ ...boardStyle, backgroundColor: this.props.backgroundColor }}
            onClick={this.onClick}
            onDoubleClick={this.onDoubleClick}
            onDragOver={this.onDragOver}
            onDrop={this.onDrop}
            onPaste={this.onPaste}
            role="presentation"
          >
            {cardChildren}
          </div>
        </ContextMenuTrigger>
      </div>
    )
  }
}
