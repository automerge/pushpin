import React, { useState } from 'react'
import classNames from 'classnames'
import mime from 'mime-types'

import Content from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { parseDocumentLink, HypermergeUrl } from '../../../ShareLink'

import { BoardDocCard } from '.'
import { Position } from './BoardGrid'
import { ContactDoc } from '../contact'
import { useDocument, useHyperfile } from '../../../Hooks'
import './BoardCard.css'
import {
  PUSHPIN_DRAG_TYPE,
  BOARD_CARD_DRAG_TYPE,
  BOARD_CARD_DRAG_OFFSET_X,
  BOARD_CARD_DRAG_OFFSET_Y,
} from '../../../constants'

interface BoardCardProps {
  id: string
  boardUrl: HypermergeUrl
  card: BoardDocCard

  selected: boolean
  uniquelySelected: boolean
  remoteSelected: HypermergeUrl[]

  onCardClicked(card: BoardDocCard, event: React.MouseEvent): void
  onCardDoubleClicked(card: BoardDocCard, event: React.MouseEvent): void
}

export default function BoardCard(props: BoardCardProps) {
  const {
    card,
    remoteSelected: [remoteSelectorContact],
  } = props

  const [contactDoc] = useDocument<ContactDoc>(remoteSelectorContact || null)
  const highlightColor = contactDoc && contactDoc.color

  const [drag, setDrag] = useState<Position | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })

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
    setDrag({ x: e.pageX, y: e.pageY })
    const dragOffset = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
    setDragOffset(dragOffset)

    // when dragging on the board, we want to maintain the true card element
    e.dataTransfer.setDragImage(document.createElement('img'), 0, 0)
    e.dataTransfer.setData(BOARD_CARD_DRAG_TYPE, card.id)
    e.dataTransfer.setData(BOARD_CARD_DRAG_OFFSET_X, dragOffset.x.toString())
    e.dataTransfer.setData(BOARD_CARD_DRAG_OFFSET_Y, dragOffset.y.toString())

    // we'll add the PUSHPIN_DRAG_TYPE to support dropping into non-board places
    e.dataTransfer.setData(PUSHPIN_DRAG_TYPE, card.url)

    // and we'll add a DownloadURL (if there's a toFile available on the type)
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
    setDrag({ x: e.pageX, y: e.pageY })
    e.preventDefault()
  }

  function onDragEnd(e: React.DragEvent) {
    setDrag(null)
  }

  const style: React.CSSProperties = {
    ['--highlight-color' as any]: highlightColor,
    width: card.width,
    height: card.height,
    position: drag ? 'fixed' : 'absolute',
    left: drag ? drag.x - dragOffset.x : card.x,
    top: drag ? drag.y - dragOffset.y : card.y,
  }

  const { type } = parseDocumentLink(card.url)
  const context = 'board'
  const contentType = ContentTypes.lookup({ type, context })

  const selected = props.selected || props.remoteSelected.length > 0

  // XXX - the resize-handle is totally broken right now!
  return (
    <div
      tabIndex={-1}
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
        <span className="BoardCard-resizeHandle" />
      )}
    </div>
  )
}
