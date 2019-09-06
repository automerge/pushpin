import React from 'react'
import classNames from 'classnames'

import Content from '../../Content'
import ContentTypes from '../../../ContentTypes'
import { parseDocumentLink, HypermergeUrl } from '../../../ShareLink'

import { BoardDocCard } from '.'
import { TrackingEntry, DragType, isResizing, isMoving } from './Board'
import { ContactDoc } from '../contact'
import { useDocument } from '../../../Hooks'
import './BoardCard.css'

interface BoardCardProps {
  id: string
  boardUrl: HypermergeUrl
  card: BoardDocCard

  dragState: TrackingEntry

  selected: boolean
  uniquelySelected: boolean
  remoteSelected: HypermergeUrl[]

  onCardClicked(card: BoardDocCard, event: React.MouseEvent): void
  onCardDoubleClicked(card: BoardDocCard, event: React.MouseEvent): void
  setCardRef(id: string, ref: HTMLElement | null): void
}

export default function BoardCard(props: BoardCardProps) {
  const {
    card,
    remoteSelected: [remoteSelectorContact],
  } = props

  const [doc] = useDocument<ContactDoc>(remoteSelectorContact || null)
  const highlightColor = doc && doc.color

  function onCardClicked(e: React.MouseEvent) {
    props.onCardClicked(card, e)
  }

  function onCardDoubleClicked(e: React.MouseEvent) {
    props.onCardDoubleClicked(card, e)
  }

  function setCardRef(node: HTMLElement | null) {
    props.setCardRef(props.id, node)
  }

  function stopPropagation(e: React.SyntheticEvent) {
    e.stopPropagation()
  }

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', card.url)

    /*    if (badgeRef.current) {
      e.dataTransfer.setDragImage(badgeRef.current, 0, 0)
    } */
  }
  const style: React.CSSProperties = {
    ['--highlight-color' as any]: highlightColor,
    position: 'absolute',
    width: card.width,
    height: card.height,
    left: card.x,
    top: card.y,
  }

  const { type } = parseDocumentLink(card.url)
  const context = 'board'
  const contentType = ContentTypes.lookup({ type, context })

  const selected = props.selected || props.remoteSelected.length > 0

  return (
    <div
      ref={setCardRef}
      tabIndex={-1}
      id={`card-${card.id}`}
      className={classNames(
        'BoardCard',
        `BoardCard-${card.type}`,
        selected && 'BoardCard--selected'
      )}
      style={style}
      onClick={onCardClicked}
      onDoubleClick={onCardDoubleClicked}
      onContextMenu={stopPropagation}
      draggable
      onDragStart={onDragStart}
    >
      <Content context="board" url={card.url} uniquelySelected={props.uniquelySelected} />
      {contentType && contentType.resizable !== false && (
        <span className="BoardCard-resizeHandle" />
      )}
    </div>
  )
}
