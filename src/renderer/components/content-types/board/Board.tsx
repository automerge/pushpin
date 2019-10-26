import React, {
  useRef,
  useCallback,
  memo,
  useMemo,
  RefForwardingComponent,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react'
import Debug from 'debug'
import { ContextMenuTrigger } from 'react-contextmenu'

import ContentTypes from '../../../ContentTypes'
import * as ImportData from '../../../ImportData'
import { PushpinUrl } from '../../../ShareLink'
import { ContentProps, ContentHandle } from '../../Content'
import { BoardDoc, CardId, BoardDocCard } from '.'
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

const Board: RefForwardingComponent<ContentHandle, ContentProps> = (props: ContentProps, ref) => {
  useImperativeHandle(ref, () => ({
    onContent: (url: PushpinUrl) => onContent(url),
  }))

  const boardRef = useRef<HTMLDivElement>(null)
  const { selection, selectOnly, selectToggle, selectNone } = useSelection<CardId>()

  const [doc, dispatch] = useDocumentReducer<BoardDoc, BoardAction>(
    props.hypermergeUrl,
    (doc, action) => {
      switch (action.type) {
        // board actions
        case 'AddCardForContent':
          addAndSelectCard(doc, action.position, action.url, action.selectOnly)
          break
        case 'ChangeBackgroundColor':
          changeBackgroundColor(doc, action.color)
          break
        case 'DeleteCards':
          deleteCards(doc, selection)
          break

        // card actions
        case 'CardDragEnd':
          moveCardsBy(doc, selection, action.distance)
          break
        case 'CardResized':
          cardResized(doc, action.cardId, action.dimension)
          break
        case 'CardClicked':
          onCardClicked(action.cardId, action.event)
          break
        case 'CardDoubleClicked':
          onCardDoubleClicked(doc, action.cardId, action.event)
          break
      }
    },
    [selection]
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // this event can be consumed by a card if it wants to keep control of backspace
      // for example, see text-content.jsx onKeyDown
      if (e.key === 'Backspace') {
        dispatch({ type: 'DeleteCards', selection })
      }
    },
    [dispatch, selection]
  )

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      log('onClick')
      selectNone()
    },
    [selectNone]
  )

  // xxx: this one is tricky because it feels like it should be in boardDocManipulation
  // but there isn't really a good way to get the cardId back from the dispatch
  function addAndSelectCard(
    doc: BoardDoc,
    position: Position,
    url: PushpinUrl,
    shouldSelect?: boolean
  ) {
    const cardId = addCardForContent(doc, { position, url })
    if (shouldSelect) {
      selectOnly(cardId)
    }
  }

  const onCardClicked = (id: CardId, e: React.MouseEvent) => {
    if (e.ctrlKey || e.shiftKey) {
      selectToggle(id)
    } else {
      // otherwise we don't have shift/ctrl, so just set selection to this
      selectOnly(id)
    }
    e.stopPropagation()
  }

  const onCardDoubleClicked = (doc: BoardDoc, id: CardId, e: React.MouseEvent) => {
    const card = doc.cards[id]
    if (card && card.url) {
      window.location.href = card.url as string
    }
    e.stopPropagation()
  }

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
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
        dispatch({ type: 'AddCardForContent', position, url })
      })
    },
    [boardRef, dispatch]
  )

  /*  const onDragStart = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }, [])
  */

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const onDropInternal = (e: React.DragEvent) => {
    e.dataTransfer.dropEffect = 'move'
    // do nothing (for now)
  }

  const onDropExternal = useCallback(
    (e: React.DragEvent) => {
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
    },
    [dispatch]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // If we have an origin board, and it's us, this is a move operation.
      const originBoard = e.dataTransfer.getData(BOARD_CARD_DRAG_ORIGIN)
      if (originBoard === props.hypermergeUrl) {
        onDropInternal(e)
      } else {
        onDropExternal(e)
      }
    },
    [onDropExternal, props.hypermergeUrl]
  )

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
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
    },
    [dispatch]
  )

  const selectedCardUrls = useCallback((selection: CardId[], cards): PushpinUrl[] => {
    function addPlacementHintsToSearchParams(card: BoardDocCard, offset: Position) {
      const searchParams = new URLSearchParams()
      const { x, y, width, height } = card
      searchParams.set('x', (x - offset.x).toString())
      searchParams.set('y', (y - offset.y).toString())
      if (width) searchParams.set('width', width.toString())
      if (height) searchParams.set('height', height.toString())
      return searchParams.toString()
    }

    const offset = {
      x: Math.round(window.pageXOffset),
      y: Math.round(window.pageYOffset),
    }

    return selection.map(
      (c) => `${cards[c].url}&${addPlacementHintsToSearchParams(cards[c], offset)}` as PushpinUrl
    )
  }, [])

  const { cards = [] } = doc || {}

  const onCopy = useCallback(
    (e: ClipboardEvent) => {
      log('onCopy')
      e.preventDefault()
      e.stopPropagation()

      if (!e.clipboardData) {
        return
      }

      const urlList = selectedCardUrls(selection, cards).join('\n')
      e.clipboardData.setData('text/uri-list', urlList)
    },
    [cards, selectedCardUrls, selection]
  )

  const onCut = useCallback(
    (e: ClipboardEvent) => {
      onCopy(e)
      dispatch({ type: 'DeleteCards', selection })
    },
    [dispatch, onCopy, selection]
  )

  useEffect(() => {
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCut)
    return () => {
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCut)
    }
  }, [onCopy, onCut])

  const onContent = useCallback(
    (url: PushpinUrl) => {
      log('onContent')

      /* onContent currently comes from the omnibox sending us a clipper item,
         which doesn't know where it should go, so let's just stick it mid-page
         since this is also what we do for paste 
      */
      const position = {
        x: window.pageXOffset + window.innerWidth / 2 - GRID_SIZE * 6,
        y: window.pageYOffset + window.innerHeight / 2,
      }

      dispatch({ type: 'AddCardForContent', position, url })
      return true
    },
    [dispatch]
  )

  const docTitle = doc && doc.title ? doc.title : ''
  const contentTypes = useMemo(() => ContentTypes.list({ context: 'board' }), [])
  const { backgroundColor = '#fff' } = doc || {}

  const style = useMemo(
    () => ({
      backgroundColor,
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
    }),
    [backgroundColor]
  )

  /**
   * at long last, render begins here
   */
  log('render')
  if (!doc) {
    return null
  }

  const cardChildren = Object.entries(cards).map(([id, card]) => {
    const isSelected = selection.includes(id as CardId) // sadly we can't have IDs as non-string types
    const uniquelySelected = isSelected && selection.length === 1
    return (
      <BoardCard
        key={id}
        id={id as CardId}
        x={card.x}
        y={card.y}
        width={card.width}
        height={card.height}
        url={card.url}
        boardUrl={props.hypermergeUrl}
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
      style={style}
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
        boardTitle={docTitle}
        contentTypes={contentTypes}
        dispatch={dispatch}
        backgroundColor={backgroundColor}
        backgroundColors={BOARD_COLOR_VALUES}
      />
      <ContextMenuTrigger holdToDisplay={-1} id="BoardMenu">
        <div>{cardChildren}</div>
      </ContextMenuTrigger>
    </div>
  )
}

export default memo(forwardRef(Board))
