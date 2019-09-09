import React, { useState, useRef } from 'react'
import classNames from 'classnames'
import mime from 'mime-types'

import Content from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { parseDocumentLink, HypermergeUrl } from '../../../ShareLink'

import { BoardDocCard, CardId } from '.'
import { Position, Dimension } from './BoardGrid'
import { ContactDoc } from '../contact'
import { useDocument, useHyperfile } from '../../../Hooks'
import './BoardCard.css'
import { PUSHPIN_DRAG_TYPE, BOARD_CARD_DRAG_ORIGIN } from '../../../constants'
import { boundDimension, boundSizeByType } from './BoardBoundary'

interface BoardCardProps {
  id: string
  boardUrl: HypermergeUrl
  card: BoardDocCard

  selected: boolean
  uniquelySelected: boolean
  remoteSelected: HypermergeUrl[]

  onCardClicked(card: BoardDocCard, event: React.MouseEvent): void
  onCardDoubleClicked(card: BoardDocCard, event: React.MouseEvent): void
  resizeCard(id: CardId, dimension: Dimension): void

  announceDragOffset(amount: Position): void
  dragOffset: Position
}

export default function BoardCard(props: BoardCardProps) {
  const {
    card,
    remoteSelected: [remoteSelectorContact],
  } = props

  const [contactDoc] = useDocument<ContactDoc>(remoteSelectorContact || null)
  const highlightColor = contactDoc && contactDoc.color

  const [dragStart, setDragStart] = useState<Position | null>(null)

  const [resizeStart, setResizeStart] = useState<Position | null>(null)

  const [resize, setResize] = useState<Dimension | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)

  const { hypermergeUrl } = parseDocumentLink(card.url)
  const [doc] = useDocument<any>(hypermergeUrl)

  // yeeeech
  const { hyperfileUrl = null, title = 'untitled' } = doc || {}
  const hyperfileData = useHyperfile(hyperfileUrl)

  function onCardClicked(e: React.MouseEvent) {
    props.onCardClicked(card, e)
  }

  function onCardDoubleClicked(e: React.MouseEvent) {
    props.onCardDoubleClicked(card, e)
  }

  function stopPropagation(e: React.SyntheticEvent) {
    e.stopPropagation()
  }

  function onDragStart(e: React.DragEvent) {
    if (!selected) {
      props.onCardClicked(card, e)
    }
    setDragStart({ x: e.pageX, y: e.pageY })

    // when dragging on the board, we want to maintain the true card element
    e.dataTransfer.setDragImage(document.createElement('img'), 0, 0)

    // annotate the drag with the current board's URL so we can tell if this is where we came from
    e.dataTransfer.setData(BOARD_CARD_DRAG_ORIGIN, props.boardUrl)

    // we'll add the PUSHPIN_DRAG_TYPE to support dropping into non-board places
    e.dataTransfer.setData(PUSHPIN_DRAG_TYPE, card.url)

    // and we'll add a DownloadURL
    if (hyperfileData) {
      const { mimeType } = hyperfileData
      const extension = mime.extension(mimeType) || ''

      const downloadUrl = `text:${title}.${extension}:${hyperfileUrl}`
      e.dataTransfer.setData('DownloadURL', downloadUrl)
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

    props.announceDragOffset({ x: e.pageX - dragStart.x, y: e.pageY - dragStart.y })
    e.preventDefault()
  }

  function onDragEnd(e: React.DragEvent) {
    setDragStart(null)
    props.announceDragOffset({ x: 0, y: 0 })
  }

  const resizePointerDown = (e: React.PointerEvent) => {
    if (!selected) {
      props.onCardClicked(card, e)
    }
    setResizeStart({ x: e.pageX, y: e.pageY })
    setResize({ width: card.width, height: card.height })
    ;(e.target as Element).setPointerCapture(e.pointerId)
    e.preventDefault()
    e.stopPropagation()
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
      props.resizeCard(card.id, resize)
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

  const selected = props.selected || props.remoteSelected.length > 0

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
