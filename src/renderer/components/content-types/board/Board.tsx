import React, { useRef, useState, useCallback, memo } from 'react'
import Debug from 'debug'
import { ContextMenuTrigger } from 'react-contextmenu'

import ContentTypes from '../../../ContentTypes'
import * as ImportData from '../../../ImportData'
import { PushpinUrl } from '../../../ShareLink'
import { ContentProps } from '../../Content'
import { BoardDoc, BoardDocCard, CardId } from '.'
import BoardCard, { BoardCardAction } from './BoardCard'
import BoardContextMenu from './BoardContextMenu'
import './Board.css'
import { Position, Dimension, gridOffset, GRID_SIZE } from './BoardGrid'
import { useSelection } from './BoardSelection'
import {
  deleteCards,
  addCardForContent,
  moveCardsBy,
  cardResized,
  changeBackgroundColor,
  BoardDocManipulationAction,
} from './BoardDocManipulation'

import { BOARD_CARD_DRAG_ORIGIN } from '../../../constants'
import { useDocumentReducer } from '../../../Hooks'

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

export type BoardAction = BoardDocManipulationAction | BoardCardAction

interface CardArgs {
  position: Position
  dimension?: Dimension
}

export interface AddCardArgs extends CardArgs {
  url: PushpinUrl
}

function Board(props: ContentProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const { selection, selectOnly, selectToggle, selectNone } = useSelection<CardId>()
  const [distance, setDistance] = useState<Position>({ x: 0, y: 0 })

  const onKeyDown = useCallback(
    (e) => {
      // this event can be consumed by a card if it wants to keep control of backspace
      // for example, see text-content.jsx onKeyDown
      if (e.key === 'Backspace') {
        dispatch({ type: 'DeleteCards', selection })
      }
    },
    [selection]
  )

  const onClick = useCallback((e) => {
    log('onClick')
    selectNone()
  }, [])

  const [doc, dispatch] = useDocumentReducer<BoardDoc, BoardAction>(
    props.hypermergeUrl,
    (doc, action) => {
      let cardId // hmmm
      switch (action.type) {
        case 'MoveCardsBy':
          moveCardsBy(doc, action.selection, action.distance)
          break
        case 'DeleteCards':
          deleteCards(doc, selection)
          break
        case 'Dragging':
          setDistance(action.distance)
          break
        case 'Resized':
          cardResized(doc, action.cardId, action.dimension)
          break
        case 'Clicked':
          onCardClicked(doc.cards[action.cardId], action.event)
          break
        case 'DoubleClicked':
          onCardDoubleClicked(doc.cards[action.cardId], action.event)
          break
        case 'AddCardForContent':
          cardId = addCardForContent(doc, { position: action.position, url: action.url })
          if (action.selectOnly) {
            selectOnly(cardId)
          }
          break
        case 'ChangeBackgroundColor':
          changeBackgroundColor(doc, action.color)
          break
      }
    }
  )

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
      dispatch({ type: 'AddCardForContent', position, url, selectOnly: true })
    })
  }

  const onDragOver = (e) => {
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
    dispatch({ type: 'MoveCardsBy', selection, distance })
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
      dispatch({ type: 'AddCardForContent', position, url })
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
      dispatch({ type: 'AddCardForContent', position: offsetPosition, url })
    })
  }

  /*
  const changeBackgroundColorCurried = useStaticCallback((color) =>
    changeDoc((b) => changeBackgroundColor(b, color))
  )

  const addCardForContentCurried = useStaticCallback((addCardArgs) =>
    changeDoc((b) => addCardForContent(b, addCardArgs))
  ) */

  /**
   * at long last, render begins here
   */
  log('render')
  if (!(doc && doc.cards)) {
    return null
  }

  const { cards } = doc
  const cardChildren = Object.entries(cards).map(([id, card]) => {
    const isSelected = selection.includes(id as CardId) // sadly we can't have IDs as non-string types
    const uniquelySelected = isSelected && selection.length === 1
    return (
      <BoardCard
        key={id}
        id={id}
        boardUrl={props.hypermergeUrl}
        card={card}
        dragOffset={isSelected ? distance : { x: 0, y: 0 }}
        selected={isSelected}
        uniquelySelected={uniquelySelected}
        dispatch={dispatch}
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
        dispatch={dispatch}
        backgroundColor={doc.backgroundColor || BOARD_COLORS.DEFAULT}
        backgroundColors={BOARD_COLOR_VALUES}
      />
      <ContextMenuTrigger holdToDisplay={-1} id="BoardMenu">
        <div>{cardChildren}</div>
      </ContextMenuTrigger>
    </div>
  )
}

export default memo(Board)
