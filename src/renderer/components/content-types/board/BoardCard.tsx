import React, { useState, useRef, memo } from 'react'
import classNames from 'classnames'
import mime from 'mime-types'

import Content from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { parseDocumentLink, HypermergeUrl } from '../../../ShareLink'

import { BoardDocCard, CardId } from '.'
import { Position, Dimension } from './BoardGrid'
import { useSelf, useDocument } from '../../../Hooks'
import { usePresence } from '../../../PresenceHooks'
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

interface CardDragEnd {
  type: 'CardDragEnd'
  distance: Position
}

export type BoardCardAction = CardClicked | CardDoubleClicked | CardResized | CardDragEnd

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
      : undefined,
    id
  )

  const presence = remotePresences.find(
    (presence) => presence && presence.data && presence.data.color
  )
  const highlightColor = presence ? presence!.data!.color : undefined
  // ^^ we proved it has data & color above, so ! is reasonable

  const [dragStart, setDragStart] = useState<Position | null>(null)

  const [resizeStart, setResizeStart] = useState<Position | null>(null)

  const selected = props.selected || highlightColor
  const [resize, setResize] = useState<Dimension | null>(null)
  const [originalSize, setOriginalSize] = useState<Dimension | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const selectedCardsRef = useRef<NodeListOf<HTMLDivElement> | null>(null)
  const previousDistance = useRef<Position | null>(null)

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

    const distance = { x: e.pageX - dragStart.x, y: e.pageY - dragStart.y }

    // we throw away the first frame because it's getting the wrong pageX / pageY
    // but only on windows and linux. if it's long after 9/19/2019 see if you get
    // weird flickering at the start of drag when you remove this check
    if (!previousDistance.current) {
      previousDistance.current = distance
      return
    }

    // don't make CSS changes if we haven't moved position
    if (previousDistance.current.x === distance.x && previousDistance.current.y === distance.y) {
      return
    }

    previousDistance.current = distance

    // we want to skip expensive React recalculations, so we'll just update the style directly here
    selectedCardsRef.current = document.querySelectorAll('.BoardCard--selected')
    if (selectedCardsRef.current) {
      selectedCardsRef.current.forEach((element) => {
        element.style.setProperty('--drag-x', `${distance.x}px`)
        element.style.setProperty('--drag-y', `${distance.y}px`)
      })
    }

    e.preventDefault()
  }

  function onDragEnd(e: React.DragEvent) {
    if (!dragStart) {
      return
    }

    const distance = { x: e.pageX - dragStart.x, y: e.pageY - dragStart.y }

    dispatch({ type: 'CardDragEnd', distance })
    setDragStart(null)
    previousDistance.current = null

    if (selectedCardsRef.current) {
      selectedCardsRef.current.forEach((element) => {
        element.style.setProperty('--drag-x', '0px')
        element.style.setProperty('--drag-y', '0px')
      })
    }
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
    setOriginalSize({ width: widthC, height: heightC })
    setResize({ width: widthC, height: heightC })
      ; (event.target as Element).setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
  }

  const resizePointerMove = (e: React.PointerEvent) => {
    if (!resize || !resizeStart || !originalSize) {
      return
    }

    if (!cardRef.current) {
      return
    }

    const movedSize = {
      width: originalSize.width - resizeStart.x + e.pageX,
      height: originalSize.height - resizeStart.y + e.pageY,
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
    willChange: selected ? 'transform' : '',
    transform: `translate(${x}px, ${y}px) translate(var(--drag-x, 0), var(--drag-y, 0))`,
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
