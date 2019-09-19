import React, { useState, useRef, memo } from 'react'
import classNames from 'classnames'

import Content from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { parseDocumentLink, HypermergeUrl } from '../../../ShareLink'

import { BoardDocCard, CardId } from '.'
import { Position, Dimension } from './BoardGrid'
import { usePresence, useSelf } from '../../../Hooks'
import './BoardCard.css'
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

export type BoardCardAction = CardClicked | CardDoubleClicked | CardResized

interface BoardCardProps extends BoardDocCard {
  id: CardId
  boardUrl: HypermergeUrl
  selected: boolean
  uniquelySelected: boolean

  dispatch(action: BoardCardAction): void
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

  const [resizeStart, setResizeStart] = useState<Position | null>(null)

  const selected = props.selected || remotePresence
  const [resize, setResize] = useState<Dimension | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)

  function onCardClicked(event: React.MouseEvent) {
    dispatch({ type: 'CardClicked', cardId: id, event })
  }

  function onCardDoubleClicked(event: React.MouseEvent) {
    dispatch({ type: 'CardDoubleClicked', cardId: id, event })
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
    ;(e.target as Element).releasePointerCapture(e.pointerId)
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
    willChange: selected ? 'transform' : '',
    transform: `translate3d(${x}px, ${y}px, 0) translate(var(--drag-x, 0), var(--drag-y, 0))`,
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
      onPointerDown={onCardClicked}
      onDoubleClick={onCardDoubleClicked}
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

export default memo(BoardCard)
