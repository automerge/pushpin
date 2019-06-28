import React from 'react'
import ReactDOM from 'react-dom'
import { remote } from 'electron'
import Debug from 'debug'
import { ContextMenuTrigger } from 'react-contextmenu'
import uuid from 'uuid/v4'

import Content, { ContentProps } from '../Content'
import ContentTypes from '../../content-types'
import { IMAGE_DIALOG_OPTIONS, PDF_DIALOG_OPTIONS } from '../../constants'
import { createDocumentLink, parseDocumentLink } from '../../ShareLink'
import * as Hyperfile from '../../hyperfile'
import { BoardDoc } from '.'
import BoardCard from './BoardCard'
import BoardContextMenu from './BoardContextMenu'
import { Handle } from 'hypermerge'

const { dialog } = remote

const log = Debug('pushpin:board')

const BOARD_COLORS = {
  DEFAULT: '#D5DFE5',
  SNOW: '#EBEDF4',
  BEIGE: '#f3f1ec',
  CANVAS: '#D8D1C0',
  SKY: '#dcf3f6',
  VIOLET: '#e5dcf6',
  PINK: '#ffe1e7',
  HERB: '#daefd2',
  PEACH: '#ffd2cc',
  RUST: '#D96767',
  ENGINEER: '#FFE283',
  KEYLIME: '#A1E991',
  PINE: '#63D2A5',
  SOFT: '#64BCDF',
  BIGBLUE: '#3A66A3',
  ROYAL: '#A485E2',
  KAWAII: '#ED77AA',
  BLACK: '#2b2b2b'
}

const BOARD_WIDTH = 3600
const BOARD_HEIGHT = 1800
const GRID_SIZE = 20

const CARD_MIN_WIDTH = 81
const CARD_MIN_HEIGHT = 41

// We don't want to compute a new array in every render.
const BOARD_COLOR_VALUES = Object.values(BOARD_COLORS)

const draggableCards = (cards, selected, card) => {
  if (selected.length > 0 && selected.find(id => id === card.id)) {
    return selected.map(id => cards[id])
  }
  return [card]
}

interface State {
  selected: any[]
  remoteSelection: { [contact: string]: string[] },
  contextMenuPosition?: {
    x: number
    y: number
  }
  tracking: { [cardId: string]: TrackingEntry }
  doc?: BoardDoc
} 

export enum DragType {
  MOVING,
  RESIZING,
  NOT_DRAGGING
}

export interface MoveTracking {
  dragType: DragType.MOVING
  moveX: number,
  moveY: number,
  slackX: number,
  slackY: number
}

export interface ResizeTracking {
  dragType: DragType.RESIZING
  slackWidth: number,
  slackHeight: number,
  resizeWidth: number,
  resizeHeight: number,
  minWidth: number,
  minHeight: number,
  maxWidth: number,
  maxHeight: number
}

export interface NotDraggingTracking {
  dragType: DragType.NOT_DRAGGING
}

export function isMoving(tracking): tracking is MoveTracking {
  return (tracking.dragType == DragType.MOVING)
}

export function isResizing(tracking): tracking is ResizeTracking {
  return (tracking.dragType == DragType.RESIZING)
}

export type TrackingEntry = MoveTracking | ResizeTracking | NotDraggingTracking

interface CardArgs {
  x: number
  y: number
  width?: number
  height?: number
}

interface LinkCardArgs extends CardArgs {
  url: string
}

interface CreateCardArgs extends CardArgs {
  type: string
  typeAttrs?: any
}

export default class Board extends React.PureComponent<ContentProps, State> {
  private handle?: Handle<BoardDoc>

  private boardRef = React.createRef<HTMLDivElement>()
  private cardRefs: Map<string, BoardCard> = new Map<string, BoardCard>()
  private finishedDrag: boolean = false
  private tracking: { [cardId: string]: TrackingEntry } = {}
  
  private heartbeatTimerId?: NodeJS.Timer
  private contactHeartbeatTimerId: Map<string, NodeJS.Timer> = new Map<string, NodeJS.Timer>()
  
  state: State = {
    remoteSelection: {},
    selected: [],
    tracking: {}
  }

  static initializeDocument(board, { title, backgroundColor }) {
    log('initializeDocument')
    board.title = title || 'No Title'
    const BOARD_COLOR_VALUES = Object.values(BOARD_COLORS)
    const color = backgroundColor
      || BOARD_COLOR_VALUES[Math.floor(Math.random() * BOARD_COLOR_VALUES.length)]
    board.backgroundColor = color
    board.cards = {}
    board.authorIds = []
  }

  componentWillMount = () => {
    this.handle = window.repo.open(this.props.hypermergeUrl)
    this.handle.subscribe((doc) => this.onChange(doc))
    this.handle.subscribeMessage((msg) => this.onMessage(msg))
  }
  componentWillUnmount = () => {
    this.handle && this.handle.close()
    this.heartbeatTimerId && clearInterval(this.heartbeatTimerId)
  }
  
  onChange = (doc) => {
    this.setState({ doc })
  }

  onKeyDown = (e) => {
    // this event can be consumed by a card if it wants to keep control of backspace
    // for example, see text-content.jsx onKeyDown
    if (e.key === 'Backspace') {
      this.deleteCard(this.state.selected)
    }
  }

  onClick = (e) => {
    log('onClick')
    this.selectNone()
  }

  onCardClicked = (e, card) => {
    if (this.finishedDrag) {
      // this is the end of a resize / move event, don't change selection
      this.finishedDrag = false
      e.stopPropagation()
      return
    }

    if (e.ctrlKey || e.shiftKey) {
      this.selectToggle(card.id)
    } else {
      // otherwise we don't have shift/ctrl, so just set selection to this
      this.selectOnly(card.id)
    }
    e.stopPropagation()
  }

  onCardDoubleClicked = (e, card) => {
    window.location = card.url
    e.stopPropagation()
  }

  onDoubleClick = (e) => {
    log('onDoubleClick')
    console.log("WTF", (this.boardRef as any).offsetLeft, (this.boardRef as any).offsetTop)
    
    // guard against a missing boardRef
    if (!this.boardRef.current) return

    const cardId = this.createCard({
      x: e.pageX - this.boardRef.current.offsetLeft,
      y: e.pageY - this.boardRef.current.offsetTop,
      type: 'text' })
    this.selectOnly(cardId)
  }

  onDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  getFiles = (dataTransfer) => {
    const files: any[] = []
    // XXX: if i recall correctly, this is a weird array that can't be iterated over
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

  onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const { pageX, pageY } = e

    if (!this.boardRef.current) return
    const localX = pageX - this.boardRef.current.offsetLeft
    const localY = pageY - this.boardRef.current.offsetTop

    const url = e.dataTransfer.getData('application/pushpin-url')
    if (url) {
      this.linkCard({ x: localX, y: localY, url })
      return
    }

    /* Adapted from:
      https://www.meziantou.net/2017/09/04/upload-files-and-directories-using-an-input-drag-and-drop-or-copy-and-paste-with */
    const { length } = e.dataTransfer.files
    for (let i = 0; i < length; i += 1) {
      const entry = e.dataTransfer.files[i]
      const reader = new FileReader()
      const x = localX + (i * (GRID_SIZE * 2))
      const y = localY + (i * (GRID_SIZE * 2))

      if (entry.type.match('image/')) {
        reader.onload = () => {
          this.createImageCardFromBuffer({ x, y }, Buffer.from(reader.result as ArrayBuffer))
        }
        reader.readAsArrayBuffer(entry)
      } else if (entry.type.match('application/pdf')) {
        reader.onload = () => {
          this.createPdfCardFromBuffer({ x, y }, Buffer.from(reader.result as ArrayBuffer))
        }
        reader.readAsArrayBuffer(entry)
      } else if (entry.type.match('text/')) {
        reader.onload = () => {
          this.createCard({
            x: localX + (i * (GRID_SIZE * 2)),
            y: localY + (i * (GRID_SIZE * 2)),
            type: 'text',
            typeAttrs: { text: reader.readAsText(entry) }
          })
        }
      }
    }
    if (length > 0) { return }

    // If we can't get the item as a bunch of files, let's hope it works as plaintext.
    const plainText = e.dataTransfer.getData('text/plain')
    if (plainText) {
      try {
        const url = new URL(plainText)
        if (url.protocol === 'pushpin:') {
          this.linkCard({ x: pageX, y: pageY, url: url.toString() })
        } else {
          this.createCard({ x: pageX, y: pageY, type: 'url', typeAttrs: { url: url.toString() } })
        }
      } catch (e) {
        // i guess it's not a URL, just make a text card
        this.createCard({ x: pageX, y: pageY, type: 'text', typeAttrs: { text: plainText } })
      }
    }
  }

  /* We can't get the mouse position on a paste event,
     so we ask the window for the current pageX/Y offsets and just stick the new card
     100px in from there. (The new React might support this through pointer events.) */
  onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    log('onPaste')
    e.preventDefault()
    e.stopPropagation()

    const x = window.pageXOffset + 100
    const y = window.pageYOffset + 100

    const dataTransfer = e.clipboardData
    if (!dataTransfer) return
    
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
        reader.onload = () => {
          // xxx: talk to jeff on this one
          this.createImageCardFromBuffer({ x, y }, Buffer.from(reader.result as ArrayBuffer))
        }
        reader.readAsArrayBuffer(file)
      })
    }

    const plainTextData = dataTransfer.getData('text/plain')
    if (plainTextData) {
      try {
        const url = new URL(plainTextData)
        if (url.protocol === 'pushpin:') {
          this.linkCard({ x, y, url: url.toString() })
        } else {
          this.createCard({ x, y, type: 'url', typeAttrs: { url: url.toString() } })
        }
      } catch (e) {
        // i guess it's not a URL, just make a text card
        this.createCard({ x, y, type: 'text', typeAttrs: { text: plainTextData } })
      }
    }
  }

  addContent = (e, contentType) => {
    e.stopPropagation()

    if (!this.boardRef.current) { return }
    if (!this.state.contextMenuPosition) { return }

    const x = this.state.contextMenuPosition.x - this.boardRef.current.getBoundingClientRect().left
    const y = this.state.contextMenuPosition.y - this.boardRef.current.getBoundingClientRect().top

    let cardId
    /* the contents of this switch statement
       should almost certainly run in the relevant components */
    switch (contentType.type) {
      case 'image':
        dialog.showOpenDialog(IMAGE_DIALOG_OPTIONS, (paths) => {
          // User aborted.
          if (!paths) {
            return
          }
          if (paths.length !== 1) {
            throw new Error('Expected exactly one path?')
          }

          cardId = this.createImageCardFromPath({ x, y }, paths[0])
          // this happens here because we're in a callback
          this.selectOnly(cardId)
        })
        break
      case 'pdf':
        dialog.showOpenDialog(PDF_DIALOG_OPTIONS, (paths) => {
          // User aborted.
          if (!paths) {
            return
          }
          if (paths.length !== 1) {
            throw new Error('Expected exactly one path?')
          }

          cardId = this.createPdfCardFromPath({ x, y }, paths[0])
          // this happens here because we're in a callback
          this.selectOnly(cardId)
        })
        break
      case 'board':
        const title = (this.state.doc && this.state.doc.title) 
          ? this.state.doc.title 
          : 'Untitled'
        cardId = this.createCard({
          x,
          y,
          type: contentType.type,
          typeAttrs: { title: `Sub-board of ${title}` }
        })
        this.selectOnly(cardId)
        break
      default:
        cardId = this.createCard({
          x,
          y,
          type: contentType.type,
          typeAttrs: { text: '' }
        })
        this.selectOnly(cardId)
    }
  }

  createPdfCardFromPath = ({ x, y }, path) => {
    Hyperfile.write(path, (err, hyperfileUrl) => {
      if (err) {
        log(err)
        return
      }

      const cardId = this.createCard({
        x,
        y,
        type: 'pdf',
        typeAttrs: { hyperfileUrl }
      })
      this.selectOnly(cardId)
    })
  }

  createPdfCardFromBuffer = ({ x, y }, buffer) => {
    Hyperfile.writeBuffer(buffer, (err, hyperfileUrl) => {
      if (err) {
        log(err)
        return
      }

      const cardId = this.createCard({
        x,
        y,
        type: 'pdf',
        typeAttrs: { hyperfileUrl }
      })
      this.selectOnly(cardId)
    })
  }

  createImageCardFromPath = ({ x, y }, path) => {
    Hyperfile.write(path, (err, hyperfileUrl) => {
      if (err) {
        log(err)
        return
      }

      const cardId = this.createCard({
        x,
        y,
        type: 'image',
        typeAttrs: { hyperfileUrl }
      })
      this.selectOnly(cardId)
    })
  }

  createImageCardFromBuffer = ({ x, y }, buffer) => {
    Hyperfile.writeBuffer(buffer, (err, hyperfileUrl) => {
      if (err) {
        log(err)
        return
      }

      const cardId = this.createCard({
        x,
        y,
        type: 'image',
        typeAttrs: { hyperfileUrl }
      })
      this.selectOnly(cardId)
    })
  }


  createCard = ({ x, y, width, height, type, typeAttrs }: CreateCardArgs) => {
    const hypermergeUrl = Content.initializeContentDoc(type, typeAttrs)
    return this.linkCard({ x, y, width, height, url: createDocumentLink(type, hypermergeUrl) })
  }

  linkCard = ({ x, y, width, height, url }: LinkCardArgs) => {
    const id = uuid()

    const { type } = parseDocumentLink(url)
    const { component = {} } = ContentTypes.lookup({ type, context: 'board' })

    width = width ? this.snapMeasureToGrid(width) : undefined
    width = component.defaultWidth ? component.defaultWidth * GRID_SIZE : undefined
    height = height ? this.snapMeasureToGrid(height) : undefined
    height = component.defaultHeight ? component.defaultHeight * GRID_SIZE : undefined

    this.handle && this.handle.change((b) => {
      const snapX = this.snapCoordinateToGrid(x)
      const snapY = this.snapCoordinateToGrid(y)
      const newCard = {
        id,
        url,
        x: snapX,
        y: snapY,
        width,
        height,
      }
      b.cards[id] = newCard
    })

    return id
  }

  deleteCard = (id) => {
    // allow either an array or a single card to be passed in
    if (id.constructor !== Array) {
      id = [id]
    }

    this.handle && this.handle.change((b) => {
      id.forEach((id) => delete b.cards[id])
    })
  }

  changeTitle = (title) => {
    log('changeTitle')
    this.handle && this.handle.change((b) => {
      b.title = title
    })
  }

  changeBackgroundColor = (color) => {
    log('changeBackgroundColor')
    this.handle && this.handle.change((b) => {
      b.backgroundColor = color.hex
    })
  }

  /**
   *
   * Card placement / manipulation actions
   *
   */

  cardMoved = ({ id, x, y }) => {
    if (!(this.state.doc && this.state.doc.cards)) return

    // This gets called when uniquely selecting a card, so avoid a document
    // change if in fact the card hasn't moved mod snapping.
    const snapX = this.snapCoordinateToGrid(x)
    const snapY = this.snapCoordinateToGrid(y)
    if (snapX === this.state.doc.cards[id].x && snapY === this.state.doc.cards[id].y) {
      return
    }
    this.handle && this.handle.change((b) => {
      const card = b.cards[id]
      card.x = snapX
      card.y = snapY
    })
  }

  cardResized = ({ id, width, height }) => {
    if (!(this.state.doc && this.state.doc.cards)) return

    // This gets called when we click the drag corner of a card, so avoid a
    // document change if in fact the card won't resize mod snapping.
    const snapWidth = this.snapMeasureToGrid(width)
    const snapHeight = this.snapMeasureToGrid(height)
    if (snapWidth === this.state.doc.cards[id].width
      && snapHeight === this.state.doc.cards[id].height) {
      return
    }
    this.handle && this.handle.change((b) => {
      const card = b.cards[id]
      card.width = snapWidth
      card.height = snapHeight
    })
  }

  /**
   *
   * Grid manipulation functions
   *
   */

  // Snap given num to nearest multiple of our grid size.
  snapToGrid = (num) => {
    const resto = num % GRID_SIZE
    if (resto <= (GRID_SIZE / 2)) {
      return num - resto
    }
    return num + GRID_SIZE - resto
  }

  // We have slightly different snap functions for coordinates (x,y) and
  // measures (height, width) because we want the latter to be a bit larger
  // than the grid size to allow overlapping boarders of adjacent elements.
  // We also have a special variant of the measure snap that ensures it only
  // ever increases the measure, which are needed for some types of content
  // (like text which shouldn't get cut off by snapping).

  snapCoordinateToGrid = (coordinate) => this.snapToGrid(coordinate)
  snapMeasureToGrid = (measure) => this.snapToGrid(measure) + 1

  snapMeasureOutwardToGrid = (measure) => {
    const snapped = this.snapMeasureToGrid(measure)
    if (snapped >= measure) {
      return snapped
    }
    return snapped + GRID_SIZE
  }

  effectDrag = (card, tracking: TrackingEntry, { deltaX, deltaY }) => {
    if ((deltaX === 0) && (deltaY === 0)) {
      return
    }

    if (isMoving(tracking)) {
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
      newX = Math.min(newX, BOARD_WIDTH - card.width)
      tracking.moveX = newX
      newY = Math.max(newY, 0)
      newY = Math.min(newY, BOARD_HEIGHT - card.height)
      tracking.moveY = newY

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      tracking.slackX = tracking.slackX + preClampX - newX
      tracking.slackY = tracking.slackY + preClampY - newY
    }

    if (isResizing(tracking)) {
      // First guess at change in dimensions given mouse movements.
      const preClampWidth = tracking.resizeWidth + deltaX
      const preClampHeight = tracking.resizeHeight + deltaY

      if ((preClampWidth + card.x) > BOARD_WIDTH || (preClampHeight + card.y) > BOARD_HEIGHT) {
        return
      }

      // Add slack to the values used to calculate bound position. This will
      // ensure that if we start removing slack, the element won't react to
      // it right away until it's been completely removed.
      let newWidth = preClampWidth + tracking.slackWidth
      let newHeight = preClampHeight + tracking.slackHeight

      // Clamp to ensure card doesn't resize beyond the board or min dimensions.
      newWidth = Math.max(tracking.minWidth, newWidth)
      newWidth = Math.min(tracking.maxWidth, newWidth)
      newWidth = Math.min(BOARD_WIDTH - card.x, newWidth)
      tracking.resizeWidth = newWidth
      newHeight = Math.max(tracking.minHeight, newHeight)
      newHeight = Math.min(tracking.maxHeight, newHeight)
      newHeight = Math.min(BOARD_HEIGHT - card.y, newHeight)
      tracking.resizeHeight = newHeight

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      tracking.slackWidth = tracking.slackWidth + preClampWidth - newWidth
      tracking.slackHeight = tracking.slackHeight + preClampHeight - newHeight
    }
  }

  setCardRef = (id, node) => {
    this.cardRefs[id] = node
  }

  onDrag = (card, e, d) => {
    if (!(this.state.doc && this.state.doc.cards)) return
    log('onDrag')
    const tracking = this.tracking[card.id]

    // If we haven't started tracking this drag, initialize tracking
    if (!tracking) {
      const resizing = e.target.className === 'cardResizeHandle'
      const moving = !resizing

      if (moving) {
        const cards = draggableCards(this.state.doc.cards, this.state.selected, card)

        cards.forEach(c => {
          this.tracking[c.id] = {
            dragType: DragType.MOVING,
            moveX: c.x,
            moveY: c.y,
            slackX: 0,
            slackY: 0,
          }
        })
      }

      if (resizing) {
        // If the card has no fixed dimensions yet, get its current rendered dimensions
        if (!Number.isInteger(card.width) || !Number.isInteger(card.height)) {
          this.handle && this.handle.change(b => {
            // clientWidth and clientHeight are rounded so we add 1px to get the ceiling,
            // this prevents visual changes like scrollbar from triggering on drag
            /* eslint react/no-find-dom-node: "off" */
            b.cards[card.id].width = ReactDOM.findDOMNode(this.cardRefs[card.id]).clientWidth + 1
            b.cards[card.id].height = ReactDOM.findDOMNode(this.cardRefs[card.id]).clientHeight + 1
          })

          card = this.state.doc.cards[card.id]
        }

        const { type } = parseDocumentLink(card.url)
        const { component = {} } = ContentTypes.lookup({ type, context: 'board' })
        const minWidth = (component.minWidth * GRID_SIZE) || CARD_MIN_WIDTH
        const minHeight = (component.minHeight * GRID_SIZE) || CARD_MIN_HEIGHT
        const maxWidth = (component.maxWidth * GRID_SIZE) || Infinity
        const maxHeight = (component.maxWidth * GRID_SIZE) || Infinity

        this.tracking[card.id] = {
          dragType: DragType.RESIZING,
          slackWidth: 0,
          slackHeight: 0,
          resizeWidth: card.width,
          resizeHeight: card.height,
          minWidth,
          minHeight,
          maxWidth,
          maxHeight,
        }
      }

      return
    }

    if (tracking.dragType === DragType.MOVING) {
      const cards = draggableCards(this.state.doc.cards, this.state.selected, card)
      cards.forEach(card => {
        const t = this.tracking[card.id]
        this.effectDrag(card, t, d)

        this.setState((prevState) =>
          ({ tracking: {
              ...prevState.tracking,
              [card.id]: t
            }
          })
        )
      })
    }

    if (tracking.dragType === DragType.RESIZING) {
      this.effectDrag(card, tracking, d)
      
      this.setState((prevState) =>
        ({ tracking: {
            ...prevState.tracking,
            [card.id]: tracking
          }
        })
      )
    }
  }

  onMessage = (msg) => {
    const { contact, selected } = msg

    if (contact && selected) {
      this.setState((prevState) =>
        ({
          remoteSelection: {
            ...prevState.remoteSelection,
            [contact]: selected
          }
        }
        ))
    }

    // if we don't hear from another user for a while, assume they've gone offline
    if (contact) {
      clearTimeout(this.contactHeartbeatTimerId[contact])
      // if we miss two heartbeats (11s), assume they've gone offline
      this.contactHeartbeatTimerId[contact] = setTimeout(() => {
        this.clearRemoteSelection(contact)
      }, 3000)
    }
  }

  clearRemoteSelection = (contact) => {
    this.setState((prevState) =>
      ({
        remoteSelection: {
          ...prevState.remoteSelection,
          [contact]: undefined
        }
      }))
  }

  updateSelection = (selected) => {
    this.setState({ selected })
    this.handle && this.handle.message({ contact: this.props.selfId, selected })
  }

  selectToggle = (cardId) => {
    const { selected } = this.state

    if (selected.includes(cardId)) {
      // remove from the current state if we have it
      this.updateSelection([selected.filter((filterId) => filterId !== cardId)])
    } else {
      // add to the current state if we don't
      this.updateSelection([...selected, cardId])
    }
  }

  selectOnly = (cardId) => {
    this.updateSelection([cardId])
  }

  selectNone = () => {
    this.updateSelection([])
  }

  onStop = (card, e, d) => {
    log('onStop')
    if (!(this.state.doc && this.state.doc.cards)) return

    const { id } = card
    const tracking = this.tracking[id]

    // If tracking is not initialized, treat this as a click
    if (!tracking) {
      return
    }

    if (tracking.dragType === DragType.MOVING) {
      const cards = draggableCards(this.state.doc.cards, this.state.selected, card)
      cards.forEach(card => {
        const t = this.tracking[card.id] as MoveTracking
        
        this.cardMoved({ id: card.id, x: t.moveX, y: t.moveY })
      })
      this.tracking = {}
      this.setState({ tracking: {} })
    }

    if (tracking.dragType === DragType.RESIZING) {
      const width = tracking.resizeWidth
      const height = tracking.resizeHeight

      this.cardResized({ id: card.id, width, height })
      this.tracking = {}
      this.setState({ tracking: {} })
    }

    this.finishedDrag = true
  }

  onShowContextMenu = (e) => {
    this.setState({ contextMenuPosition: e.detail.position })
  }

  render = () => {
    log('render')
    if (!(this.state.doc && this.state.doc.cards)) return null

    // invert the client->cards to a cards->client mapping
    const { remoteSelection } = this.state
    const cardsSelected = {}
    Object.entries(remoteSelection).forEach(([contact, cards]) => {
      cards.forEach((card) => {
        if (!cardsSelected[card]) {
          cardsSelected[card] = []
        }
        cardsSelected[card].push(contact)
      })
    })

    const cards = this.state.doc.cards || {}
    const cardChildren = Object.entries(cards).map(([id, card]) => {
      const selected = this.state.selected.includes(id)
      const uniquelySelected = selected && this.state.selected.length === 1
      return (
        <BoardCard
          key={id}
          id={id}
          card={card}
          selected={selected}
          remoteSelected={cardsSelected[id] || []}
          uniquelySelected={uniquelySelected}
          dragState={this.state.tracking[id]}
          onDrag={this.onDrag}
          onStop={this.onStop}
          onCardClicked={this.onCardClicked}
          onCardDoubleClicked={this.onCardDoubleClicked}
          setCardRef={this.setCardRef}
        />
      )
    })

    return (
      <div
        className="board"
        ref={this.boardRef}
        style={{
          backgroundColor: this.state.doc.backgroundColor,
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT
        }}
        onKeyDown={this.onKeyDown}
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}
        onPaste={this.onPaste}
        role="presentation"
      >
        <BoardContextMenu
          contentTypes={ContentTypes.list({ context: 'board' })}
          addContent={this.addContent}
          onShowContextMenu={this.onShowContextMenu}
          backgroundColor={this.state.doc.backgroundColor || BOARD_COLORS.DEFAULT}
          backgroundColors={BOARD_COLOR_VALUES}
          changeBackgroundColor={this.changeBackgroundColor}
        />
        <ContextMenuTrigger holdToDisplay={-1} id="BoardMenu">
          <div>
            {cardChildren}
          </div>
        </ContextMenuTrigger>
      </div>
    )
  }
}
