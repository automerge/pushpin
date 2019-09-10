import React, { useState, useRef, useCallback } from 'react'
import classNames from 'classnames'

import Content from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { parseDocumentLink, HypermergeUrl } from '../../../ShareLink'

import { BoardDocCard, CardId } from '.'
import { Position, Dimension } from './BoardGrid'
import { ContactDoc } from '../contact'
import { useDocument } from '../../../Hooks'
import './BoardCard.css'
import { boundDimension, boundSizeByType } from './BoardBoundary'

interface BoardCardProps {
  card: BoardDocCard

  selected: boolean
  uniquelySelected: boolean
  remoteSelected: HypermergeUrl[]

  onCardClicked(card: BoardDocCard, event: React.MouseEvent): void
  onCardDoubleClicked(card: BoardDocCard, event: React.MouseEvent): void
  onCardDragStart(card: BoardDocCard, event: React.DragEvent): void
  onCardDrag(card: BoardDocCard, event: React.DragEvent): void
  onCardDragEnd(card: BoardDocCard, event: React.DragEvent): void

  resizeCard(id: CardId, dimension: Dimension): void
}

export default function BoardCard(props: BoardCardProps) {
  const {
    card,
    remoteSelected: [remoteSelectorContact],
  } = props

  const [contactDoc] = useDocument<ContactDoc>(remoteSelectorContact || null)
  const highlightColor = contactDoc && contactDoc.color

  const [resizeStart, setResizeStart] = useState<Position | null>(null)
  const [resize, setResize] = useState<Dimension | null>(null)

  const selected = props.selected || props.remoteSelected.length > 0

  const cardRef = useRef<HTMLDivElement>(null)

  const onCardClicked = useCallback(
    (e: React.MouseEvent) => {
      props.onCardClicked(card, e)
    },
    [card]
  )

  const onCardDoubleClicked = useCallback(
    (e: React.MouseEvent) => {
      props.onCardDoubleClicked(card, e)
    },
    [card]
  )

  const onContextMenu = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])

  const onCardDragStart = useCallback(
    (e: React.DragEvent) => {
      props.onCardDragStart(card, e)
    },
    [card]
  )

  const onCardDrag = useCallback(
    (e: React.DragEvent) => {
      props.onCardDrag(card, e)
    },
    [card]
  )

  const onCardDragEnd = useCallback(
    (e: React.DragEvent) => {
      props.onCardDragEnd(card, e)
    },
    [card]
  )

  const resizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!selected) {
        props.onCardClicked(card, e)
      }
      setResizeStart({ x: e.pageX, y: e.pageY })
      setResize({ width: card.width, height: card.height })
      ;(e.target as Element).setPointerCapture(e.pointerId)
      e.preventDefault()
      e.stopPropagation()
    },
    [card, selected]
  )

  const resizePointerMove = useCallback(
    (e: React.PointerEvent) => {
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
    },
    [resize, resizeStart, cardRef, card]
  )

  const resizePointerUp = useCallback((e: React.PointerEvent) => {
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    if (resize) {
      props.resizeCard(card.id, resize)
    }
    setResizeStart(null)
    setResize(null)
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const style: React.CSSProperties = {
    ['--highlight-color' as any]: highlightColor,
    width: resize ? resize.width : card.width,
    height: resize ? resize.height : card.height,
    position: 'absolute',
    left: card.x,
    top: card.y,
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
      onContextMenu={onContextMenu}
      draggable
      onDrag={onCardDrag}
      onDragStart={onCardDragStart}
      onDragEnd={onCardDragEnd}
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
