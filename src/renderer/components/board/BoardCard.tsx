import React from 'react'
import Debug from 'debug'
import { DraggableCore } from 'react-draggable'
import classNames from 'classnames'

import Content from '../Content'
import ContentTypes from '../../content-types'
import { parseDocumentLink } from '../../ShareLink'

import { BoardDocCard } from '.'
import { TrackingEntry, DragType, isResizing, isMoving } from './Board'
import { ContactDoc } from '../contact'

const log = Debug('pushpin:board-card')

interface BoardCardProps {
  id: string,
  card: BoardDocCard,

  dragState: TrackingEntry,

  selected: boolean,
  uniquelySelected: boolean,
  remoteSelected: string[],
    
  onDrag: (card, event, dragData) => void,
  onStop: (card, event, dragData) => void,
  onCardClicked: (card, event) => void,
  onCardDoubleClicked: (card, event) => void,
  setCardRef: (card, ref) => void

}

export default class BoardCard extends React.PureComponent<BoardCardProps> {
  onDrag = (e, d) => { this.props.onDrag(this.props.card, e, d) }
  onStop = (e, d) => { this.props.onStop(this.props.card, e, d) }
  onCardClicked = (e) => { this.props.onCardClicked(e, this.props.card) }
  onCardDoubleClicked = (e) => { this.props.onCardDoubleClicked(e, this.props.card) }
  setCardRef = (node) => { this.props.setCardRef(this.props.id, node) }
  
  stopPropagation = (e) => {
    e.stopPropagation()
  }

  render = () => {
    log('render')

    const { card, dragState = { dragState: DragType.NOT_DRAGGING } } = this.props

    const style = {
      position: 'absolute' as 'absolute',
      width: (isResizing(dragState)) ? dragState.resizeWidth : card.width,
      height: (isResizing(dragState)) ? dragState.resizeHeight : card.height,
      left: (isMoving(dragState)) ? dragState.moveX : card.x,
      top: (isMoving(dragState)) ? dragState.moveY : card.y,
    }

    if (this.props.remoteSelected.length > 0) {
      window.repo.watch<ContactDoc>(this.props.remoteSelected[0], (doc) => {
        if (doc) {
          style['--highlight-color'] = doc.color
        }
      })
    }

    const { type } = parseDocumentLink(card.url)
    const context = 'board'
    const contentType = ContentTypes.lookup({ type, context })

    const selected = this.props.selected || this.props.remoteSelected.length > 0

    return (
      <DraggableCore
        key={this.props.id}
        allowAnyClick={false}
        disabled={false}
        enableUserSelectHack={false}
        onDrag={this.onDrag}
        onStop={this.onStop}
      >
        <div
          ref={this.setCardRef}
          tabIndex={-1}
          id={`card-${card.id}`}
          className={classNames('card', card.type, selected ? 'selected' : 'unselected')}
          style={style}
          onClick={this.onCardClicked}
          onDoubleClick={this.onCardDoubleClicked}
          onContextMenu={this.stopPropagation}
        >
          <Content
            context="board"
            url={this.props.card.url}
            uniquelySelected={this.props.uniquelySelected}
          />
          { contentType && contentType.resizable !== false && <span className="cardResizeHandle" /> }
        </div>
      </DraggableCore>
    )
  }
}
