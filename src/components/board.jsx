import React from 'react'
import PropTypes from 'prop-types'
import { remote } from 'electron'
import Debug from 'debug'
import { ContextMenu, MenuItem as ContextMenuItem, ContextMenuTrigger } from 'react-contextmenu'
import { DraggableCore } from 'react-draggable'

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

    this.onStart = this.onStart.bind(this)
    this.onDrag = this.onDrag.bind(this)
    this.onStop = this.onStop.bind(this)

    this.tracking = {}
    this.state = { cards: {} }
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
    const { pageX, pageY } = e

    /* Adapted from:
      https://www.meziantou.net/2017/09/04/upload-files-and-directories-using-an-input-drag-and-drop-or-copy-and-paste-with */
    const { length } = e.dataTransfer.files
    for (let i = 0; i < length; i += 1) {
      const entry = e.dataTransfer.files[i]
      const reader = new FileReader()

      if (entry.type.match('image/')) {
        reader.onload = () =>
          Loop.dispatch(Model.processImage, {
            path: entry.name,
            buffer: Buffer.from(reader.result),
            x: pageX + (i * (Model.GRID_SIZE * 2)),
            y: pageY + (i * (Model.GRID_SIZE * 2)) })
        reader.readAsArrayBuffer(entry)
      } else if (entry.type.match('text/')) {
        reader.onload = () =>
          Loop.dispatch(Model.cardCreatedText, {
            text: reader.result,
            x: pageX + (i * (Model.GRID_SIZE * 2)),
            y: pageY + (i * (Model.GRID_SIZE * 2)) })
        reader.readAsText(entry)
      }
    }
    if (length > 0) { return }

    // If we can't get the item as a bunch of files, let's hope it works as plaintext.
    const plainText = e.dataTransfer.getData('text/plain')
    if (plainText) {
      Loop.dispatch(Model.cardCreatedText, {
        text: plainText,
        x: pageX,
        y: pageY })
    }
  }

  /* We can't get the mouse position on a paste event,
     so we ask the window for the current pageX/Y offsets and just stick the new card
     100px in from there. */
  async onPaste(e) {
    log('onPaste')
    e.preventDefault()
    e.stopPropagation()

    const x = window.pageXOffset + 100
    const y = window.pageYOffset + 100

    const dataTransfer = e.clipboardData
    // Note that the X/Y coordinates will all be the same for these cards,
    // and the chromium code supports that... but I can't think of it could happen,
    // so if you're reading this because it did, sorry!
    if (dataTransfer.files.length > 0) {
      Array.from(dataTransfer.files).forEach((file, i) => {
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
            x,
            y })
        reader.readAsArrayBuffer(file)
      })
    }

    const plainTextData = dataTransfer.getData('text/plain')
    if (plainTextData) {
      Loop.dispatch(Model.cardCreatedText, {
        text: plainTextData,
        x,
        y })
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

  // Copy view-relevant move/resize state over to React.
  setDragState(card, tracking) {
    const cards = { ...this.state.cards }

    cards[card.id] = {
      moveX: tracking.moveX,
      moveY: tracking.moveY,
      resizeWidth: tracking.resizeWidth,
      resizeHeight: tracking.resizeHeight
    }

    this.setState({ cards })
  }

  onStart(card, e, d) {
    log('onStart')

    const clickX = d.lastX
    const clickY = d.lastY

    this.tracking[card.id] = this.tracking[card.id] || {}
    const tracking = this.tracking[card.id]

    tracking.resizing = ((clickX >= (card.x + card.width - Model.RESIZE_HANDLE_SIZE)) &&
                         (clickX <= (card.x + card.width)) &&
                         (clickY >= (card.y + card.height - Model.RESIZE_HANDLE_SIZE)) &&
                         (clickY <= (card.y + card.height)))

    tracking.moving = !tracking.resizing

    if (tracking.moving) {
      if (this.props.selected.length > 0) {
        const cards = this.props.selected.map(s => this.props.cards[s])
        cards.push(card)
        cards.forEach(card => {
          const t = this.tracking[card.id]

          t.moveX = card.x
          t.moveY = card.y
          t.slackX = 0
          t.slackY = 0
          t.moving = true
          t.totalDrag = 0

          this.effectDrag(card, t, d)
          this.setDragState(card, t)
        })
      } else {
        tracking.moveX = card.x
        tracking.moveY = card.y
        tracking.slackX = 0
        tracking.slackY = 0
        tracking.totalDrag = 0

        this.effectDrag(card, tracking, d)
        this.setDragState(card, tracking)
      }
    }

    if (tracking.resizing) {
      tracking.resizeWidth = card.width
      tracking.resizeHeight = card.height
      tracking.slackWidth = 0
      tracking.slackHeight = 0

      this.effectDrag(card, tracking, d)
      this.setDragState(card, tracking)
    }
  }

  effectDrag(card, tracking, { deltaX, deltaY }) {
    if (!tracking.resizing && !tracking.moving) {
      throw new Error('Did not expect drag without resize or move')
    }
    if (tracking.resizing && tracking.moving) {
      throw new Error('Did not expect drag with both resize and move')
    }

    if ((deltaX === 0) && (deltaY === 0)) {
      return
    }

    tracking.totalDrag = tracking.totalDrag + Math.abs(deltaX) + Math.abs(deltaY)

    if (tracking.moving) {
      // First guess at change in location given mouse movements.
      const preClampX = tracking.moveX + deltaX
      const preClampY = tracking.moveY + deltaY

      // Add slack to the values used to calculate bound position. This will
      // ensure that if we start removing slack, the element won't react to
      // it right away until it's been completely removed.
      let newX = preClampX + tracking.slackX
      let newY = preClampY + tracking.slackY

      // Clamp to ensure card doesn't move beyond the board.
      newX = Math.max(newX, 0)
      newX = Math.min(newX, Model.BOARD_WIDTH - card.width)
      tracking.moveX = newX
      newY = Math.max(newY, 0)
      newY = Math.min(newY, Model.BOARD_HEIGHT - card.height)
      tracking.moveY = newY

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      tracking.slackX = tracking.slackX + preClampX - newX
      tracking.slackY = tracking.slackY + preClampY - newY
    }

    if (tracking.resizing) {
      // First guess at change in dimensions given mouse movements.
      let preClampWidth = tracking.resizeWidth + deltaX
      let preClampHeight = tracking.resizeHeight + deltaY

      // Maintain aspect ratio on image cards.
      if (card.type !== 'text') {
        const ratio = tracking.resizeWidth / tracking.resizeHeight
        preClampHeight = preClampWidth / ratio
        preClampWidth = preClampHeight * ratio
      }

      // Add slack to the values used to calculate bound position. This will
      // ensure that if we start removing slack, the element won't react to
      // it right away until it's been completely removed.
      let newWidth = preClampWidth + tracking.slackWidth
      let newHeight = preClampHeight + tracking.slackHeight

      // Clamp to ensure card doesn't resize beyond the board or min dimensions.
      newWidth = Math.max(Model.CARD_MIN_WIDTH, newWidth)
      newWidth = Math.min(Model.BOARD_WIDTH - card.x, newWidth)
      tracking.resizeWidth = newWidth
      newHeight = Math.max(Model.CARD_MIN_HEIGHT, newHeight)
      newHeight = Math.min(Model.BOARD_HEIGHT - card.y, newHeight)
      tracking.resizeHeight = newHeight

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      tracking.slackWidth = tracking.slackWidth + preClampWidth - newWidth
      tracking.slackHeight = tracking.slackHeight + preClampHeight - newHeight
    }
  }

  onDrag(card, e, d) {
    log('onDrag')

    if(this.props.selected.length > 0) {
      const cards = this.props.selected.map(s => this.props.cards[s])
      cards.forEach(card => {
        const tracking = this.tracking[card.id]
        this.effectDrag(card, tracking, d)
        this.setDragState(card, tracking)
      })
    } else {
      const tracking = this.tracking[card.id]

      this.effectDrag(card, tracking, d)
      this.setDragState(card, tracking)
    }
  }

  onStop(card, e, d) {
    log('onStop')

    const tracking = this.tracking[card.id]

    this.effectDrag(card, tracking, d)

    const minDragSelection = tracking.totalDrag < Model.GRID_SIZE / 2
    if (minDragSelection) {
      if (e.ctrlKey || e.shiftKey) {
        Loop.dispatch(Model.cardToggleSelection, { id: card.id })
      } else {
        Loop.dispatch(Model.cardUniquelySelected, { id: card.id })
      }
    }
    tracking.totalDrag = null

    if (tracking.moving) {
      if(this.props.selected.length > 0) {
        const cards = this.props.selected.map(s => this.props.cards[s])
        cards.forEach(card => {
          const t = this.tracking[card.id]
          const x = Model.snapToGrid(t.moveX)
          const y = Model.snapToGrid(t.moveY)

          t.moveX = null
          t.moveY = null
          t.slackX = null
          t.slackY = null
          t.moving = false

          Loop.dispatch(Model.cardMoved, { id: card.id, x, y })
          this.setDragState(card, t)
        })
      } else {
        const x = Model.snapToGrid(tracking.moveX)
        const y = Model.snapToGrid(tracking.moveY)

        tracking.moveX = null
        tracking.moveY = null
        tracking.slackX = null
        tracking.slackY = null
        tracking.moving = false

        Loop.dispatch(Model.cardMoved, { id: card.id, x, y })
        this.setDragState(card, tracking)
      }
    }

    if (tracking.resizing) {
      const width = Model.snapToGrid(tracking.resizeWidth)
      const height = Model.snapToGrid(tracking.resizeHeight)

      tracking.resizeWidth = null
      tracking.resizeHeight = null
      tracking.slackWidth = null
      tracking.slackHeight = null
      tracking.resizing = false

      Loop.dispatch(Model.cardResized, { id: card.id, width, height })
      this.setDragState(card, tracking)
    }
  }

  render() {
    log('render')

    // rework selected functioning, this is a slow implementation
    const cardChildren = Object.entries(this.props.cards).map(([id, card]) => {
      const selected = this.props.selected.includes(id)
      const uniquelySelected = selected && this.props.selected.length === 1
      return (
        <DraggableCore
          key={id}
          allowAnyClick={false}
          disabled={false}
          enableUserSelectHack={false}
          onStart={(e, d) => this.onStart(card, e, d)}
          onDrag={(e, d) => this.onDrag(card, e, d)}
          onStop={(e, d) => this.onStop(card, e, d)}
        >
          <div>
            <Card card={card} dragState={this.state.cards[id] || {}} selected={selected} uniquelySelected={uniquelySelected} />
          </div>
        </DraggableCore>
      )
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
