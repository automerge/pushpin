import React, { useState, useRef, memo } from 'react'
import classNames from 'classnames'
import mime from 'mime-types'

import Content from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { parseDocumentLink, HypermergeUrl } from '../../../ShareLink'

import { BoardDocCard, CardId } from '.'
import { Position, Dimension } from './BoardGrid'
import { usePresence, useSelf, useDocument } from '../../../Hooks'
import './BoardCard.css'
import { PUSHPIN_DRAG_TYPE, BOARD_CARD_DRAG_ORIGIN } from '../../../constants'
import { boundDimension, boundSizeByType } from './BoardBoundary'

interface CardClicked {
  type: 'CardClicked'
  cardId: CardId
  event: React.MouseEvent
}
interface CardDoubleClicked {
  type: 'CardDoubleClicked'
  cardId: CardId
  event: React.MouseEvent
}
interface CardResized {
  type: 'CardResized'
  cardId: CardId
  dimension: Dimension
}

interface CardDragging {
  type: 'CardDragging'
  distance: Position
}

export type BoardCardAction = CardClicked | CardDoubleClicked | CardResized | CardDragging

interface BoardCardProps extends BoardDocCard {
  id: CardId
  boardUrl: HypermergeUrl
  selected: boolean
  uniquelySelected: boolean

  dispatch(action: BoardCardAction): void
  dragOffsetX: number
  dragOffsetY: number
}

interface Presence {
  color: string | null
}

function BoardCard(props: BoardCardProps) {
  const { dispatch, id, url, x, y, width, height } = props

  const [self] = useSelf()
  const remotePresences = usePresence<Presence>(
    props.boardUrl,
    props.selected && self
      ? {
        color: self.color,
      }
      : null,
    id
  )
  const remotePresence = Object.values(remotePresences)[0]
  const highlightColor = remotePresence && remotePresence.color

  const [dragStart, setDragStart] = useState<Position | null>(null)

  const [resizeStart, setResizeStart] = useState<Position | null>(null)

  const selected = props.selected || remotePresence
  const [resize, setResize] = useState<Dimension | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)

  const { hypermergeUrl } = parseDocumentLink(url)
  const [doc] = useDocument<any>(hypermergeUrl)

  const {
    hyperfileUrl = null,
    title = 'untitled',
    mimeType = 'application/octet',
    extension = null,
  } = doc || {}

  function onCardClicked(event: React.MouseEvent) {
    dispatch({ type: 'CardClicked', cardId: id, event })
  }

  function onCardDoubleClicked(event: React.MouseEvent) {
    dispatch({ type: 'CardDoubleClicked', cardId: id, event })
  }

  function onDragStart(event: React.DragEvent) {
    if (!selected) {
      dispatch({ type: 'CardClicked', cardId: id, event })
    }

    setDragStart({ x: event.pageX, y: event.pageY })

    // when dragging on the board, we want to maintain the true card element
    event.dataTransfer.setDragImage(document.createElement('img'), 0, 0)

    // annotate the drag with the current board's URL so we can tell if this is where we came from
    event.dataTransfer.setData(BOARD_CARD_DRAG_ORIGIN, props.boardUrl)

    // we'll add the PUSHPIN_DRAG_TYPE to support dropping into non-board places
    event.dataTransfer.setData(PUSHPIN_DRAG_TYPE, url)

    // and we'll add a DownloadURL
    if (hyperfileUrl) {
      const outputExtension = extension || mime.extension(mimeType) || ''

      const downloadUrl = `text:${title}.${outputExtension}:${hyperfileUrl}`
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

    dispatch({
      type: 'CardDragging',
      distance: { x: e.pageX - dragStart.x, y: e.pageY - dragStart.y },
    })
    e.preventDefault()
  }

  function onDragEnd(e: React.DragEvent) {
    setDragStart(null)
    dispatch({ type: 'CardDragging', distance: { x: 0, y: 0 } })
  }

  const resizePointerDown = (event: React.PointerEvent) => {
    if (!selected) {
      dispatch({ type: 'CardClicked', cardId: id, event })
    }

    if (!cardRef.current) {
      return
    }

    setResizeStart({ x: event.pageX, y: event.pageY })
    const widthC = width || cardRef.current.clientWidth
    const heightC = height || cardRef.current.clientHeight
    setResize({ width: widthC, height: heightC })
      ; (event.target as Element).setPointerCapture(event.pointerId)
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

    const deNulledWidth = width || cardRef.current.clientWidth
    const deNulledHeight = height || cardRef.current.clientHeight

    const movedSize = {
      width: deNulledWidth - resizeStart.x + e.pageX,
      height: deNulledHeight - resizeStart.y + e.pageY,
    }

    const clampedSize = boundSizeByType(url, movedSize)
    const boundedSize = boundDimension({ x, y }, clampedSize)

    setResize(boundedSize)
    e.preventDefault()
    e.stopPropagation()
  }

  const resizePointerUp = (e: React.PointerEvent) => {
    ; (e.target as Element).releasePointerCapture(e.pointerId)
    if (resize) {
      dispatch({ type: 'CardResized', cardId: id, dimension: resize })
    }
    setResizeStart(null)
    setResize(null)
    e.preventDefault()
    e.stopPropagation()
  }

  const style: React.CSSProperties = {
    ['--highlight-color' as any]: highlightColor,
    width: resize ? resize.width : width,
    height: resize ? resize.height : height,
    position: 'absolute',
    transform: `translate(${x + props.dragOffsetX}px, ${y + props.dragOffsetY}px)`
  }

  const { type } = parseDocumentLink(url)
  const context = 'board'
  const contentType = ContentTypes.lookup({ type, context })

  return (
    <div
      tabIndex={-1}
      ref={cardRef}
      id={`card-${id}`}
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
      <Content context="board" url={url} uniquelySelected={props.uniquelySelected} />
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

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation()
}

export default memo(BoardCard)
