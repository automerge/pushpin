import React from 'react'
import Debug from 'debug'
import uuid from 'uuid/v4'

import { Handle } from 'hypermerge'
import { ContextMenuTrigger } from 'react-contextmenu'
import { ContentProps } from '../../Content'
import ContentTypes from '../../../ContentTypes'
import * as ImportData from '../../../ImportData'
import { parseDocumentLink, PushpinUrl } from '../../../ShareLink'
import { BoardDoc } from '.'
import BoardCard from './BoardCard'
import BoardContextMenu from './BoardContextMenu'
import './Board.css'
import {
  Position,
  Dimension,
  gridOffset,
  gridCellsToPixels,
  snapDimensionToGrid,
  snapPositionToGrid,
} from './BoardGrid'
import {
  BOARD_CARD_DRAG_TYPE,
  BOARD_CARD_DRAG_OFFSET_X,
  BOARD_CARD_DRAG_OFFSET_Y,
} from '../../../constants'

const log = Debug('pushpin:board')

export const BOARD_COLORS = {
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
  BLACK: '#2b2b2b',
}

const BOARD_WIDTH = 3600
const BOARD_HEIGHT = 1800

// We don't want to compute a new array in every render.
const BOARD_COLOR_VALUES = Object.values(BOARD_COLORS)

interface State {
  selected: any[]
  remoteSelection: { [contact: string]: string[] }
  contextMenuPosition?: Position
  doc?: BoardDoc
}

interface CardArgs {
  position: Position
  dimension?: Dimension
}

export interface AddCardArgs extends CardArgs {
  url: PushpinUrl
}

export default class Board extends React.PureComponent<ContentProps, State> {
  private handle?: Handle<BoardDoc>

  private boardRef = React.createRef<HTMLDivElement>()
  private cardRefs: Map<string, HTMLDivElement> = new Map<string, HTMLDivElement>()

  private heartbeatTimerId?: NodeJS.Timer
  private contactHeartbeatTimerId: Map<string, NodeJS.Timer> = new Map<string, NodeJS.Timer>()

  state: State = {
    remoteSelection: {},
    selected: [],
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

  onCardClicked = (card, e) => {
    if (e.ctrlKey || e.shiftKey) {
      this.selectToggle(card.id)
    } else {
      // otherwise we don't have shift/ctrl, so just set selection to this
      this.selectOnly(card.id)
    }
    e.stopPropagation()
  }

  onCardDoubleClicked = (card, e) => {
    window.location = card.url
    e.stopPropagation()
  }

  onDoubleClick = (e) => {
    log('onDoubleClick')

    // guard against a missing boardRef
    if (!this.boardRef.current) {
      return
    }

    const position = {
      x: e.pageX - this.boardRef.current.offsetLeft,
      y: e.pageY - this.boardRef.current.offsetTop,
    }

    ContentTypes.create('text', { text: '' }, (url) => {
      const cardId = this.addCardForContent({ position, url })
      this.selectOnly(cardId)
    })
  }

  onDragOver = (e) => {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
    e.stopPropagation()
  }

  onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const { pageX, pageY } = e

    if (!this.boardRef.current) {
      return
    }
    const dropPosition = {
      x: pageX - this.boardRef.current.offsetLeft,
      y: pageY - this.boardRef.current.offsetTop,
    }

    if (!(this.state.doc && this.state.doc.cards)) {
      return
    }
    const cardId = e.dataTransfer.getData(BOARD_CARD_DRAG_TYPE)
    if (this.state.doc.cards[cardId]) {
      const offset = {
        x: parseFloat(e.dataTransfer.getData(BOARD_CARD_DRAG_OFFSET_X)),
        y: parseFloat(e.dataTransfer.getData(BOARD_CARD_DRAG_OFFSET_Y)),
      }
      const position = {
        x: dropPosition.x - offset.x,
        y: dropPosition.y - offset.y,
      }
      e.dataTransfer.dropEffect = 'move'
      this.cardMoved({ id: cardId, position })
      return
    }

    ImportData.importDataTransfer(e.dataTransfer, (url, i) => {
      const position = gridOffset(dropPosition, i)
      this.addCardForContent({ position, url })
    })
  }

  onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    log('onPaste')
    e.preventDefault()
    e.stopPropagation()

    if (!e.clipboardData) {
      return
    }

    /* We can't get the mouse position on a paste event,
     so we ask the window for the current pageX/Y offsets and just stick the new card
     100px in from there. (The new React might support this through pointer events.) */
    const position = {
      x: window.pageXOffset + 100,
      y: window.pageYOffset + 100,
    }

    ImportData.importDataTransfer(e.clipboardData, (url, i) => {
      const offsetPosition = gridOffset(position, i)
      this.addCardForContent({ position: offsetPosition, url })
    })
  }

  onFilesOpened = (e: React.FormEvent<HTMLInputElement>) => {
    // e.target.files
  }

  addCardForContent = ({ position, dimension, url }: AddCardArgs) => {
    const id = uuid()

    const { type } = parseDocumentLink(url)
    const { component = {} } = ContentTypes.lookup({ type, context: 'board' }) as any

    if (!dimension)
      dimension = {
        width: gridCellsToPixels(component.defaultWidth),
        height: gridCellsToPixels(component.defaultHeight),
      }

    this.handle &&
      this.handle.change((b) => {
        const { x, y } = snapPositionToGrid(position)
        const { width, height } = snapDimensionToGrid(dimension)
        const newCard = {
          id,
          url,
          x,
          y,
          width,
          height,
        }
        b.cards[id] = newCard
      })

    return id
  }

  cardMoved = ({ id, position }) => {
    if (!(this.state.doc && this.state.doc.cards)) {
      return
    }

    // This gets called when uniquely selecting a card, so avoid a document
    // change if in fact the card hasn't moved mod snapping.
    const snapPosition = snapPositionToGrid(position)
    const cardPosition = { x: this.state.doc.cards[id].x, y: this.state.doc.cards[id].y }
    if (snapPosition.x === cardPosition.x && snapPosition.y === cardPosition.y) {
      return
    }
    this.handle &&
      this.handle.change((b) => {
        const card = b.cards[id]
        card.x = snapPosition.x
        card.y = snapPosition.y
      })
  }

  deleteCard = (id) => {
    // allow either an array or a single card to be passed in
    if (id.constructor !== Array) {
      id = [id]
    }

    this.handle &&
      this.handle.change((b) => {
        id.forEach((id) => delete b.cards[id])
      })
  }

  changeTitle = (title) => {
    log('changeTitle')
    this.handle &&
      this.handle.change((b) => {
        b.title = title
      })
  }

  changeBackgroundColor = (color) => {
    log('changeBackgroundColor')
    this.handle &&
      this.handle.change((b) => {
        b.backgroundColor = color.hex
      })
  }

  onMessage = (msg) => {
    const { contact, selected } = msg

    if (contact && selected) {
      this.setState((prevState) => ({
        remoteSelection: {
          ...prevState.remoteSelection,
          [contact]: selected,
        },
      }))
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
    this.setState((prevState) => ({
      remoteSelection: {
        ...prevState.remoteSelection,
        [contact]: undefined,
      },
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

  render = () => {
    log('render')
    if (!(this.state.doc && this.state.doc.cards)) {
      return null
    }

    // invert the client->cards to a cards->client mapping
    const { remoteSelection } = this.state
    const cardsSelected = {}
    Object.entries(remoteSelection).forEach(([contact, cards]) => {
      cards &&
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
          boardUrl={this.props.hypermergeUrl}
          card={card}
          selected={selected}
          remoteSelected={cardsSelected[id] || []}
          uniquelySelected={uniquelySelected}
          onCardClicked={this.onCardClicked}
          onCardDoubleClicked={this.onCardDoubleClicked}
        />
      )
    })

    return (
      <div
        className="Board"
        ref={this.boardRef}
        style={{
          backgroundColor: this.state.doc.backgroundColor,
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
        }}
        onKeyDown={this.onKeyDown}
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
        onDragOver={this.onDragOver}
        onDragEnter={this.onDragOver}
        onDrop={this.onDrop}
        onPaste={this.onPaste}
        role="presentation"
      >
        <BoardContextMenu
          boardTitle={this.state.doc.title}
          contentTypes={ContentTypes.list({ context: 'board' })}
          addCardForContent={this.addCardForContent}
          backgroundColor={this.state.doc.backgroundColor || BOARD_COLORS.DEFAULT}
          backgroundColors={BOARD_COLOR_VALUES}
          changeBackgroundColor={this.changeBackgroundColor}
        />
        <ContextMenuTrigger holdToDisplay={-1} id="BoardMenu">
          <div>{cardChildren}</div>
        </ContextMenuTrigger>
      </div>
    )
  }
}
