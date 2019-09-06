import React, { useRef, useState } from 'react'
import Debug from 'debug'
import uuid from 'uuid/v4'
import { DocUrl } from 'hypermerge'
import { ContextMenuTrigger } from 'react-contextmenu'

import ContentTypes from '../../../ContentTypes'
import * as ImportData from '../../../ImportData'
import { parseDocumentLink, PushpinUrl, HypermergeUrl } from '../../../ShareLink'
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
} from './BoardGrid'
import {
  BOARD_CARD_DRAG_TYPE,
  BOARD_CARD_DRAG_OFFSET_X,
  BOARD_CARD_DRAG_OFFSET_Y,
} from '../../../constants'
import { useMessaging, useDocument, useRepo } from '../../../Hooks'

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

interface CardArgs {
  position: Position
  dimension?: Dimension
}

export interface AddCardArgs extends CardArgs {
  url: PushpinUrl
}

export default function Board(props: ContentProps) {
  const [doc, changeDoc] = useDocument<BoardDoc>(props.hypermergeUrl)
  const [selected, setSelection] = useState<CardId[]>([])
  const [remoteSelection, setMyRemoteSelection] = useRemoteSelections(props.hypermergeUrl)
  const contactHeartbeatTimerIds = useRef({})
  const boardRef = useRef<HTMLDivElement>(null)
  const repo = useRepo() // for repo.message

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
      const cardId = addCardForContent({ position, url })
      selectOnly(cardId)
    })
  }

  const onDragOver = (e) => {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
    e.stopPropagation()
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const { pageX, pageY } = e

    if (!boardRef.current) {
      return
    }
    const dropPosition = {
      x: pageX - boardRef.current.offsetLeft,
      y: pageY - boardRef.current.offsetTop,
    }

    if (!(doc && doc.cards)) {
      return
    }
    const cardId = e.dataTransfer.getData(BOARD_CARD_DRAG_TYPE)
    if (doc.cards[cardId]) {
      const offset = {
        x: parseFloat(e.dataTransfer.getData(BOARD_CARD_DRAG_OFFSET_X)),
        y: parseFloat(e.dataTransfer.getData(BOARD_CARD_DRAG_OFFSET_Y)),
      }
      const position = {
        x: dropPosition.x - offset.x,
        y: dropPosition.y - offset.y,
      }
      e.dataTransfer.dropEffect = 'move'
      cardMoved({ id: cardId, position })

      // XXX - this needs updating to move all the selected cards
      return
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
     so we ask the window for the current pageX/Y offsets and just stick the new card
     100px in from there. (The new React might support this through pointer events.) */
    const position = {
      x: window.pageXOffset + 100,
      y: window.pageYOffset + 100,
    }

    ImportData.importDataTransfer(e.clipboardData, (url, i) => {
      const offsetPosition = gridOffset(position, i)
      addCardForContent({ position: offsetPosition, url })
    })
  }

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

  const cardMoved = ({ id, position }) => {
    if (!(doc && doc.cards)) {
      return
    }

    // This gets called when uniquely selecting a card, so avoid a document
    // change if in fact the card hasn't moved mod snapping.
    const snapPosition = snapPositionToGrid(position)
    const cardPosition = { x: doc.cards[id].x, y: doc.cards[id].y }
    if (snapPosition.x === cardPosition.x && snapPosition.y === cardPosition.y) {
      return
    }

    changeDoc((b) => {
      const card = b.cards[id]
      card.x = snapPosition.x
      card.y = snapPosition.y
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

  const updateSelection = (selected: CardId[]) => {
    setSelection(selected)
    setMyRemoteSelection(selected)
  }

  const selectToggle = (cardId: CardId) => {
    if (selected.includes(cardId)) {
      // remove from the current state if we have it
      const newSelection = selected.filter((filterId) => filterId !== cardId)
      updateSelection(newSelection)
    } else {
      // add to the current state if we don't
      updateSelection([...selected, cardId])
    }
  }

  const selectOnly = (cardId: CardId) => {
    updateSelection([cardId])
  }

  const selectNone = () => {
    updateSelection([])
  }

  log('render')
  if (!(doc && doc.cards)) {
    return null
  }

  interface RemoteSelectionData {
    [contact: string]: string[] | undefined // technically, undefined is not an option but...
  }

  type SendSelectionFn = (selection: string[]) => void

  interface RemoteSelectionMessage {
    contact: DocUrl
    selected: CardId[]
    depart: boolean
  }

  function useRemoteSelections(url: HypermergeUrl): [RemoteSelectionData, SendSelectionFn] {
    const [remoteSelection, setRemoteSelection] = useState<RemoteSelectionData>({})

    useMessaging<RemoteSelectionMessage>(url, (msg) => {
      const { contact, selected, depart } = msg

      if (contact) {
        clearTimeout(contactHeartbeatTimerIds.current[contact])
        // if we miss two heartbeats (11s), assume they've gone offline
        contactHeartbeatTimerIds.current[contact] = setTimeout(() => {
          setRemoteSelection({ ...remoteSelection, [contact]: undefined })
        }, 5000)
      }

      if (selected) {
        setRemoteSelection({ ...remoteSelection, [contact]: selected })
      }

      if (depart) {
        setRemoteSelection({ ...remoteSelection, [contact]: undefined })
      }
    })

    const sendFn = (selected) =>
      repo.message(props.hypermergeUrl, { contact: props.selfId, selected })

    return [remoteSelection, sendFn]
  }

  // invert the client->cards to a cards->client mapping
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

  const { cards } = doc
  const cardChildren = Object.entries(cards).map(([id, card]) => {
    const isSelected = selected.includes(id as CardId) // sadly we can't have IDs as non-string types
    const uniquelySelected = isSelected && selected.length === 1
    return (
      <BoardCard
        key={id}
        id={id}
        boardUrl={props.hypermergeUrl}
        card={card}
        selected={isSelected}
        remoteSelected={cardsSelected[id] || []}
        uniquelySelected={uniquelySelected}
        onCardClicked={onCardClicked}
        onCardDoubleClicked={onCardDoubleClicked}
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
