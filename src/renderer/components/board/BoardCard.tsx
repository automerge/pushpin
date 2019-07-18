import React from 'react'
import { DraggableCore, DraggableData } from 'react-draggable'
import classNames from 'classnames'

import Content from '../Content'
import ContentTypes from '../../ContentTypes'
import { parseDocumentLink } from '../../ShareLink'

import { BoardDocCard } from '.'
import { TrackingEntry, DragType, isResizing, isMoving } from './Board'
import { ContactDoc } from '../contact'
import { useDocument } from '../../Hooks'
import './BoardCard.css'

type DraggableEvent =
  | React.MouseEvent<HTMLElement | SVGElement>
  | React.TouchEvent<HTMLElement | SVGElement>
  | MouseEvent
  | TouchEvent

interface BoardCardProps {
  id: string
  card: BoardDocCard

  dragState: TrackingEntry

  selected: boolean
  uniquelySelected: boolean
  remoteSelected: string[]

  onDrag(card: BoardDocCard, event: DraggableEvent, dragData: DraggableData): void
  onStop(card: BoardDocCard, event: DraggableEvent, dragData: DraggableData): void
  onCardClicked(card: BoardDocCard, event: React.MouseEvent): void
  onCardDoubleClicked(card: BoardDocCard, event: React.MouseEvent): void
  setCardRef(id: string, ref: HTMLElement | null): void
}

export default function BoardCard(props: BoardCardProps) {
  const {
    card,
    dragState = { dragState: DragType.NOT_DRAGGING },
    remoteSelected: [remoteSelection],
  } = props

  const [doc] = useDocument<ContactDoc>(remoteSelection || null)
  const highlightColor = doc && doc.color

  function onDrag(e: DraggableEvent, d: DraggableData) {
    props.onDrag(card, e, d)
  }

  function onStop(e: DraggableEvent, d: DraggableData) {
    props.onStop(card, e, d)
  }

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

  const style: React.CSSProperties = {
    ['--highlight-color' as any]: highlightColor,
    position: 'absolute',
    width: isResizing(dragState) ? dragState.resizeWidth : card.width,
    height: isResizing(dragState) ? dragState.resizeHeight : card.height,
    left: isMoving(dragState) ? dragState.moveX : card.x,
    top: isMoving(dragState) ? dragState.moveY : card.y,
  }

  const { type } = parseDocumentLink(card.url)
  const context = 'board'
  const contentType = ContentTypes.lookup({ type, context })

  const selected = props.selected || props.remoteSelected.length > 0

  return (
    <DraggableCore
      key={props.id}
      allowAnyClick={false}
      disabled={false}
      enableUserSelectHack={false}
      onDrag={onDrag}
      onStop={onStop}
    >
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
      >
        <Content context="board" url={card.url} uniquelySelected={props.uniquelySelected} />
        {contentType && contentType.resizable !== false && (
          <span className="BoardCard-resizeHandle" />
        )}
      </div>
    </DraggableCore>
  )
}
