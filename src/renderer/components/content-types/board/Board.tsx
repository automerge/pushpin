import React, { useRef } from 'react'
import Debug from 'debug'
import uuid from 'uuid/v4'
import { ContextMenuTrigger } from 'react-contextmenu'
// import mime from 'mime-types'

import ContentTypes from '../../../ContentTypes'
import * as ImportData from '../../../ImportData'
import { parseDocumentLink, PushpinUrl } from '../../../ShareLink'
import { ContentProps } from '../../Content'
import { BoardDoc, BoardDocCard, CardId } from '.'
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
  GRID_SIZE,
  useDistance,
} from './BoardGrid'
import { boundPosition } from './BoardBoundary'

import { BOARD_CARD_DRAG_ORIGIN, PUSHPIN_DRAG_TYPE } from '../../../constants'
import { useDocument } from '../../../Hooks'
import { useSelection } from './BroadcastSelection'

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

export const BOARD_WIDTH = 3600
export const BOARD_HEIGHT = 1800

// We don't want to compute a new array in every render.
const BOARD_COLOR_VALUES = Object.values(BOARD_COLORS)

interface CardArgs {
  position: Position
  dimension?: Dimension
}

export interface AddCardArgs extends CardArgs {
  url: PushpinUrl
}

export default function Board(props: ContentProps) {
  const [doc, changeDoc] = useDocument<BoardDoc>(props.hypermergeUrl)
  const boardRef = useRef<HTMLDivElement>(null)
  const { selected, selectOnly, selectToggle, selectNone } = useSelection()

  const { distance, startMeasure, setCurrent, endMeasure } = useDistance()

  /*
  const { hypermergeUrl } = parseDocumentLink(card.url)
  const [doc] = useDocument<any>(hypermergeUrl)

  // yeeeech
  const { hyperfileUrl = null, title = 'untitled' } = doc || {}
  const hyperfileData = useHyperfile(hyperfileUrl)
  */

  const onKeyDown = (e) => {
    // this event can be consumed by a card if it wants to keep control of backspace
    // for example, see text-content.jsx onKeyDown
    if (e.key === 'Backspace') {
      deleteCard(selected)
    }
  }

  const onClick = (e) => {
    log('onClick')
    selectNone()
  }

  const onCardClicked = (card: BoardDocCard, e) => {
    if (e.ctrlKey || e.shiftKey) {
      selectToggle(card.id)
    } else {
      // otherwise we don't have shift/ctrl, so just set selection to this
      selectOnly(card.id)
    }
    e.stopPropagation()
  }

  const onCardDoubleClicked = (card, e) => {
    window.location = card.url
    e.stopPropagation()
  }

  function onCardDragStart(card: BoardDocCard, e: React.DragEvent) {
    if (!selected.includes(card.id)) {
      onCardClicked(card, e)
    }

    startMeasure({ x: e.pageX, y: e.pageY })

    // when dragging on the board, we want to maintain the true card element
    e.dataTransfer.setDragImage(document.createElement('img'), 0, 0)

    // annotate the drag with the current board's URL so we can tell if this is where we came from
    e.dataTransfer.setData(BOARD_CARD_DRAG_ORIGIN, props.hypermergeUrl)

    // we'll add the PUSHPIN_DRAG_TYPE to support dropping into non-board places
    e.dataTransfer.setData(PUSHPIN_DRAG_TYPE, card.url)

    /*
    // and we'll add a DownloadURL
    if (hyperfileData) {
      const { mimeType } = hyperfileData
      const extension = mime.extension(mimeType) || ''

      const downloadUrl = `text:${title}.${extension}:${hyperfileUrl}`
      e.dataTransfer.setData('DownloadURL', downloadUrl)
    }
    */
  }

  // we don't want to make changes to the document until the drag ends
  // but we want to move the actual DOM element during the drag so that
  // we don't have ugly ghosting
  function onCardDrag(card: BoardDocCard, e: React.DragEvent) {
    // if you drag outside the window, you'll get an onDrag where pageX and pageY are zero.
    // this sticks the drag preview into a dumb spot, so we're just going to filter those out
    // unless anyone has a better idea.
    if (e.screenX === 0 && e.screenY === 0) {
      return
    }

    setCurrent({ x: e.pageX, y: e.pageY })
    e.preventDefault()
  }

  function onCardDragEnd(card: BoardDocCard, e: React.DragEvent) {
    endMeasure()
  }

  const onDoubleClick = (e) => {
    log('onDoubleClick')

    // guard against a missing boardRef
    if (!boardRef.current) {
      return
    }

    const position = {
      x: e.pageX - boardRef.current.offsetLeft,
      y: e.pageY - boardRef.current.offsetTop,
    }

    ContentTypes.create('text', { text: '' }, (url) => {
      // XXX: this needs to have a corrected offset to keep new cards from going out of bounds
      const cardId = addCardForContent({ position, url })
      selectOnly(cardId)
    })
  }

  const onDragOver = (e) => {
    // HTML5's default dragOver is to end the drag session
    // this is necessary boilerplate on anything that wants
    // to receive drops
    e.preventDefault()
    e.stopPropagation()
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // If we have an origin board, and it's us, this is a move operation.
    const originBoard = e.dataTransfer.getData(BOARD_CARD_DRAG_ORIGIN)
    if (originBoard === props.hypermergeUrl) {
      onDropInternal(e)
    } else {
      onDropExternal(e)
    }
  }

  const onDropInternal = (e) => {
    e.dataTransfer.dropEffect = 'move'
    moveCardsBy(selected, distance)
  }

  const onDropExternal = (e) => {
    if (!boardRef.current) {
      return
    }

    // Otherwise consttruct the drop point and import the data.
    const { pageX, pageY } = e
    const dropPosition = {
      x: pageX - boardRef.current.offsetLeft,
      y: pageY - boardRef.current.offsetTop,
    }
    ImportData.importDataTransfer(e.dataTransfer, (url, i) => {
      const position = gridOffset(dropPosition, i)
      addCardForContent({ position, url })
    })
  }

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    log('onPaste')
    e.preventDefault()
    e.stopPropagation()

    if (!e.clipboardData) {
      return
    }

    /* We can't get the mouse position on a paste event,
     so we just stick the card in the middle of the current scrolled position screen.
     (We bump it a bit to the left too to pretend we're really centering, but doing that
      would require knowledge of the card's ) */
    const position = {
      x: window.pageXOffset + window.innerWidth / 2 - GRID_SIZE * 6,
      y: window.pageYOffset + window.innerHeight / 2,
    }

    ImportData.importDataTransfer(e.clipboardData, (url, i) => {
      const offsetPosition = gridOffset(position, i)
      addCardForContent({ position: offsetPosition, url })
    })
  }

  /*
   * Card manipulation functions
   * all the functions in this section call changeDoc
   */
  const addCardForContent = ({ position, dimension, url }: AddCardArgs) => {
    const id = uuid() as CardId // ehhhhh

    const { type } = parseDocumentLink(url)
    const { component = {} } = ContentTypes.lookup({ type, context: 'board' }) as any

    if (!dimension)
      dimension = {
        width: gridCellsToPixels(component.defaultWidth),
        height: gridCellsToPixels(component.defaultHeight),
      }

    changeDoc((b: BoardDoc) => {
      const { x, y } = snapPositionToGrid(position)
      const { width, height } = snapDimensionToGrid(dimension)
      const newCard: BoardDocCard = {
        id,
        url,
        x,
        y,
      }
      // Automerge doesn't accept undefined values,
      // which we use to indicate content should set its own size on that dimension.
      if (width) {
        newCard.width = width
      }
      if (height) {
        newCard.height = height
      }

      // XXX: this should be keeping the card within the board bounds

      b.cards[id] = newCard
    })

    return id
  }

  const moveCardsBy = (selected: CardId[], offset: Position) => {
    if (!(doc && doc.cards)) {
      return
    }
    changeDoc((b) => {
      selected.forEach((id) => {
        const position = {
          x: doc.cards[id].x + offset.x,
          y: doc.cards[id].y + offset.y,
        }

        const size = {
          width: doc.cards[id].width,
          height: doc.cards[id].height,
        }

        const boundedPosition = boundPosition(position, size)
        const newPosition = snapPositionToGrid(boundedPosition)

        // This gets called when uniquely selecting a card, so avoid a document
        // change if in fact the card hasn't moved mod snapping.
        const cardPosition = { x: doc.cards[id].x, y: doc.cards[id].y }
        if (newPosition.x === cardPosition.x && newPosition.y === cardPosition.y) {
          return
        }

        const card = b.cards[id]
        card.x = newPosition.x
        card.y = newPosition.y
      })
    })
  }

  const cardResized = (id: CardId, dimension: Dimension) => {
    if (!(doc && doc.cards)) {
      return
    }

    // This gets called when uniquely selecting a card, so avoid a document
    // change if in fact the card hasn't moved mod snapping.
    const snapDimension = snapDimensionToGrid(dimension)
    const cardDimension = { width: doc.cards[id].width, height: doc.cards[id].height }
    if (
      snapDimension.width === cardDimension.width &&
      snapDimension.height === cardDimension.height
    ) {
      return
    }

    changeDoc((b) => {
      const card = b.cards[id]
      card.width = snapDimension.width
      card.height = snapDimension.height
    })
  }

  const deleteCard = (id) => {
    // allow either an array or a single card to be passed in
    if (id.constructor !== Array) {
      id = [id]
    }

    changeDoc((b) => {
      id.forEach((id) => delete b.cards[id])
    })
  }

  const changeBackgroundColor = (color) => {
    log('changeBackgroundColor')
    changeDoc((b) => {
      b.backgroundColor = color.hex
    })
  }

  /**
   * at long last, render begins here
   */
  log('render')
  if (!(doc && doc.cards)) {
    return null
  }

  const { cards } = doc
  const cardChildren = Object.entries(cards).map(([id, card]) => {
    const isSelected = selected.includes(id as CardId) // sadly we can't have IDs as non-string types
    const uniquelySelected = isSelected && selected.length === 1
    return (
      <BoardCard
        key={id}
        card={{
          ...card,
          x: isSelected ? card.x + distance.x : card.x,
          y: isSelected ? card.y + distance.y : card.y,
        }}
        boardUrl={props.hypermergeUrl}
        selected={isSelected}
        uniquelySelected={uniquelySelected}
        onCardClicked={onCardClicked}
        onCardDoubleClicked={onCardDoubleClicked}
        onCardDragStart={onCardDragStart}
        onCardDrag={onCardDrag}
        onCardDragEnd={onCardDragEnd}
        resizeCard={cardResized}
      />
    )
  })

  return (
    <div
      className="Board"
      ref={boardRef}
      style={{
        backgroundColor: doc.backgroundColor,
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
      }}
      onKeyDown={onKeyDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDrop={onDrop}
      onPaste={onPaste}
      role="presentation"
    >
      <BoardContextMenu
        boardTitle={doc.title}
        contentTypes={ContentTypes.list({ context: 'board' })}
        addCardForContent={addCardForContent}
        backgroundColor={doc.backgroundColor || BOARD_COLORS.DEFAULT}
        backgroundColors={BOARD_COLOR_VALUES}
        changeBackgroundColor={changeBackgroundColor}
      />
      <ContextMenuTrigger holdToDisplay={-1} id="BoardMenu">
        <div>{cardChildren}</div>
      </ContextMenuTrigger>
    </div>
  )
}
