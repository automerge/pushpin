import React, { useState, useRef } from 'react'
import classNames from 'classnames'
import mime from 'mime-types'

import Content from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { parseDocumentLink, HypermergeUrl } from '../../../ShareLink'

import { BoardDocCard, CardId } from '.'
import { Position, Dimension } from './BoardGrid'
import { usePresence, useSelf, useDocument, useHyperfile } from '../../../Hooks'
import './BoardCard.css'
import { PUSHPIN_DRAG_TYPE, BOARD_CARD_DRAG_ORIGIN } from '../../../constants'
import { boundDimension, boundSizeByType } from './BoardBoundary'

interface Clicked {
  type: 'Clicked'
  cardId: CardId
  event: React.MouseEvent
}
interface DoubleClicked {
  type: 'DoubleClicked'
  cardId: CardId
  event: React.MouseEvent
}
interface Resized {
  type: 'Resized'
  cardId: CardId
  dimension: Dimension
}

interface Dragging {
  type: 'Dragging'
  distance: Position
}

export type BoardCardAction = Clicked | DoubleClicked | Resized | Dragging

interface BoardCardProps {
  id: string
  boardUrl: HypermergeUrl
  card: BoardDocCard
  selected: boolean
  uniquelySelected: boolean

  dispatch(action: BoardCardAction): void
  dragOffset: Position
}

interface Presence {
  color: string | null
}

export default function BoardCard(props: BoardCardProps) {
  const { dispatch, card } = props
  const cardId = card.id

  const [self] = useSelf()
  const remotePresences = usePresence<Presence>(
    props.boardUrl,
    props.selected && self
      ? {
          color: self.color,
        }
      : null,
    card.id
  )
  const remotePresence = Object.values(remotePresences)[0]
  const highlightColor = remotePresence && remotePresence.color

  const [dragStart, setDragStart] = useState<Position | null>(null)

  const [resizeStart, setResizeStart] = useState<Position | null>(null)

  const selected = props.selected || remotePresence
  const [resize, setResize] = useState<Dimension | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)

  const { hypermergeUrl } = parseDocumentLink(card.url)
  const [doc] = useDocument<any>(hypermergeUrl)

  // yeeeech
  const { hyperfileUrl = null, title = 'untitled' } = doc || {}
  const hyperfileData = useHyperfile(hyperfileUrl)

  function onCardClicked(event: React.MouseEvent) {
    dispatch({ type: 'Clicked', cardId, event })
  }

  function onCardDoubleClicked(event: React.MouseEvent) {
    dispatch({ type: 'DoubleClicked', cardId, event })
  }

  function stopPropagation(e: React.SyntheticEvent) {
    e.stopPropagation()
  }

  function onDragStart(event: React.DragEvent) {
    if (!selected) {
      dispatch({ type: 'Clicked', cardId, event })
    }

    setDragStart({ x: event.pageX, y: event.pageY })

    // when dragging on the board, we want to maintain the true card element
    event.dataTransfer.setDragImage(document.createElement('img'), 0, 0)

    // annotate the drag with the current board's URL so we can tell if this is where we came from
    event.dataTransfer.setData(BOARD_CARD_DRAG_ORIGIN, props.boardUrl)

    // we'll add the PUSHPIN_DRAG_TYPE to support dropping into non-board places
    event.dataTransfer.setData(PUSHPIN_DRAG_TYPE, card.url)

    // and we'll add a DownloadURL
    if (hyperfileData) {
      const { mimeType } = hyperfileData
      const extension = mime.extension(mimeType) || ''

      const downloadUrl = `text:${title}.${extension}:${hyperfileUrl}`
      event.dataTransfer.setData('DownloadURL', downloadUrl)
    }
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

    dispatch({ type: 'Dragging', distance: { x: e.pageX - dragStart.x, y: e.pageY - dragStart.y } })
    e.preventDefault()
  }

  function onDragEnd(e: React.DragEvent) {
    setDragStart(null)
    dispatch({ type: 'Dragging', distance: { x: 0, y: 0 } })
  }

  const resizePointerDown = (event: React.PointerEvent) => {
    if (!selected) {
      dispatch({ type: 'Clicked', cardId, event })
    }
    setResizeStart({ x: event.pageX, y: event.pageY })
    setResize({ width: card.width, height: card.height })
    ;(event.target as Element).setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
  }

  const resizePointerMove = (e: React.PointerEvent) => {
    if (!resize || !resizeStart) {
      return
    }

    if (!cardRef.current) {
      return
    }

    if (!card.width) {
      card.width = cardRef.current.clientWidth
    }

    if (!card.height) {
      card.height = cardRef.current.clientHeight
    }

    const movedSize = {
      width: card.width - resizeStart.x + e.pageX,
      height: card.height - resizeStart.y + e.pageY,
    }

    const clampedSize = boundSizeByType(card.url, movedSize)
    const boundedSize = boundDimension({ x: card.x, y: card.y }, clampedSize)

    setResize(boundedSize)
    e.preventDefault()
    e.stopPropagation()
  }

  const resizePointerUp = (e: React.PointerEvent) => {
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    if (resize) {
      dispatch({ type: 'Resized', cardId, dimension: resize })
    }
    setResizeStart(null)
    setResize(null)
    e.preventDefault()
    e.stopPropagation()
  }

  const style: React.CSSProperties = {
    ['--highlight-color' as any]: highlightColor,
    width: resize ? resize.width : card.width,
    height: resize ? resize.height : card.height,
    position: 'absolute',
    left: card.x + props.dragOffset.x,
    top: card.y + props.dragOffset.y,
  }

  const { type } = parseDocumentLink(card.url)
  const context = 'board'
  const contentType = ContentTypes.lookup({ type, context })

  return (
    <div
      tabIndex={-1}
      ref={cardRef}
      id={`card-${card.id}`}
      className={classNames('BoardCard', selected && 'BoardCard--selected')}
      style={style}
      onClick={onCardClicked}
      onDoubleClick={onCardDoubleClicked}
      onContextMenu={stopPropagation}
      draggable
      onDrag={onDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <Content context="board" url={card.url} uniquelySelected={props.uniquelySelected} />
      {contentType && contentType.resizable !== false && (
        <span
          onPointerDown={resizePointerDown}
          onPointerMove={resizePointerMove}
          onPointerUp={resizePointerUp}
          onPointerCancel={resizePointerUp}
          className="BoardCard-resizeHandle"
        />
      )}
    </div>
  )
}
