import React, { useState, memo, useRef } from 'react'
import { DocUrl } from 'hypermerge'
import { useStaticCallback } from '../../../Hooks'
import BoardCard from './BoardCard'
import { Position } from './BoardGrid'
import { BoardDoc, CardId } from '.'
import { BoardAction } from './Board'
import {
  BOARD_CARD_DRAG_ORIGIN,
  PUSHPIN_DRAG_TYPE,
  BOARD_CARD_DRAG_CARD_IDS,
} from '../../../constants'

export type SelectionData<T> = T[]

/*
 * Selection manipulation functions
 * these functional control the currently selected set of cards
 */
export function useSelection<T>(): {
  selection: SelectionData<T>
  selectToggle: (id: T) => void
  selectOnly: (id: T) => void
  selectNone: () => void
} {
  const [selection, setSelection] = useState<T[]>([])

  const selectToggle = useStaticCallback((id: T) =>
    setSelection((selected) =>
      selected.includes(id) ? selected.filter((filterId) => filterId !== id) : [...selected, id]
    )
  )

  const selectOnly = useStaticCallback((id: T) => {
    setSelection([id])
  })

  const selectNone = useStaticCallback(() => {
    setSelection([])
  })

  return { selection, selectOnly, selectToggle, selectNone }
}

interface SelectionProps {
  doc: BoardDoc
  selection: CardId[]
  boardUrl: DocUrl
  dispatch: (action: BoardAction) => void
}

function Selection(props: SelectionProps) {
  const [dragStart, setDragStart] = useState<Position | null>(null)
  const selectionRef = useRef<HTMLDivElement | null>(null)

  function onDragStart(event: React.DragEvent) {
    setDragStart({ x: event.pageX, y: event.pageY })

    // when dragging on the board, we want to maintain the true card element
    event.dataTransfer.setDragImage(document.createElement('img'), 0, 0)

    // annotate the drag with the current board's URL so we can tell if this is where we came from
    event.dataTransfer.setData(BOARD_CARD_DRAG_ORIGIN, props.boardUrl)
    event.dataTransfer.setData(BOARD_CARD_DRAG_CARD_IDS, selection.join('\n'))

    // we'll add the PUSHPIN_DRAG_TYPE to support dropping into non-board places
    const dragString = selection
      .map((id) => doc.cards[id])
      .map((card) => card.url)
      .join('\n')
    event.dataTransfer.setData(PUSHPIN_DRAG_TYPE, dragString)

    // and we'll add a DownloadURL
    /* if (hyperfileUrl) {
      const outputExtension = extension || mime.extension(mimeType) || ''

      const downloadUrl = `text:${title}.${outputExtension}:${hyperfileUrl}`
      event.dataTransfer.setData('DownloadURL', downloadUrl)
    } */
  }

  // we don't want to make changes to the document until the drag ends
  // but we want to move the actual DOM element during the drag so that
  // we don't have ugly ghosting
  function onDrag(e: React.DragEvent) {
    if (!dragStart) {
      return
    }

    // if you drag outside the window, you'll get an onDrag where pageX and pageY are zero.
    // this sticks the drag preview into a dumb spot, so we're just going to filter those out
    // unless anyone has a better idea.
    if (e.screenX === 0 && e.screenY === 0) {
      return
    }

    const distance = { x: e.pageX - dragStart.x, y: e.pageY - dragStart.y }

    // we want to skip expensive React recalculations, so we'll just update the style directly here
    if (!(selectionRef && selectionRef.current)) {
      return
    }

    selectionRef.current.style.setProperty('--drag-x', `${distance.x}px`)
    selectionRef.current.style.setProperty('--drag-y', `${distance.y}px`)

    e.preventDefault()
  }

  function onDragEnd(e: React.DragEvent) {
    if (!dragStart) {
      return
    }

    const distance = { x: e.pageX - dragStart.x, y: e.pageY - dragStart.y }

    dispatch({ type: 'DragEnd', distance })
    setDragStart(null)

    if (!(selectionRef && selectionRef.current)) {
      return
    }

    selectionRef.current.style.setProperty('--drag-x', '0px')
    selectionRef.current.style.setProperty('--drag-y', '0px')
  }

  const { doc, selection, boardUrl, dispatch } = props
  const { cards = [] } = doc || {}

  const cardChildren = selection.map((id) => {
    const card = cards[id]
    if (!card) {
      return null
    }

    const isSelected = true
    const uniquelySelected = selection.length === 1
    return (
      <BoardCard
        key={id}
        id={id as CardId}
        x={card.x}
        y={card.y}
        width={card.width}
        height={card.height}
        url={card.url}
        boardUrl={boardUrl}
        selected={isSelected}
        uniquelySelected={uniquelySelected}
        dispatch={dispatch}
      />
    )
  })

  return (
    <div
      className="Board--selection"
      ref={selectionRef}
      draggable
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
    >
      {cardChildren}
    </div>
  )
}

export default memo(Selection)
