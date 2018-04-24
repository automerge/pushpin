import React from 'react'
import { connect } from 'react-redux'
import { DraggableCore } from 'react-draggable'
import classNames from 'classnames'

import InlineEditor from './inline-editor'
import { CARD_DRAG_STARTED, CARD_DRAG_MOVED, CARD_DRAG_STOPPED } from './action-types'

class CardPresentation extends React.Component {

  renderTextInner() {
    return (
      <InlineEditor
        cardId={this.props.card.id}
        text={this.props.card.text}
        selected={this.props.selected}
      />
    )
  }

  renderImageInner() {
    return (
      <img
        className='image'
        src={this.props.card.path}
      />
    )
  }

  render() {
    const card = this.props.card
    return (
      <DraggableCore
        allowAnyClick={false}
        disabled={false}
        enableUserSelectHack={false}
        onStart={(e, d) => this.props.onStart(card, e, d)}
        onDrag={(e, d) => this.props.onDrag(card, e, d)}
        onStop={(e, d) => this.props.onStop(card, e, d)}
        onMouseDown={(e) => this.props.onMouseDown(card, e)}
      >
        <div
          id={`card-${card.id}`}
          className={classNames('card', card.type, this.props.selected ? 'selected' : 'unselected')}
          style={{
            width: card.width,
            height: card.height,
            position: 'absolute',
            left: card.x,
            top: card.y
          }}>
          { card.type === 'text' ? this.renderTextInner(card) : this.renderImageInner(card) }
          <span className='cardResizeHandle' />
        </div>
      </DraggableCore>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onMouseDown: (card, e) => {
      console.log('card.onMouseDown')
    },
    onStart: (card, e, d) => {
      if (d.deltaX != 0 || d.deltaY != 0) {
        throw new Error(`Did not expect delta in onStart`)
      }
      console.log('card.onStart.start')
      dispatch({ type: CARD_DRAG_STARTED, id: card.id, x: d.lastX, y: d.lastY })
      console.log('card.onStart.finish')
    },
    onDrag: (card, e, d) => {
      if (d.deltaX != 0 || d.deltaY != 0) {
        dispatch({ type: CARD_DRAG_MOVED, id: card.id, deltaX: d.deltaX, deltaY: d.deltaY })
      }
    },
    onStop: (card, e, d) => {
      if (d.deltaX != 0 || d.deltaY != 0) {
        throw new Error(`Did not expect delta in onStart`)
      }
      console.log('card.onStop.start')
      dispatch({ type: CARD_DRAG_STOPPED, id: card.id })
      console.log('card.onStop.finish')
    }
  }
}

const Card = connect(null, mapDispatchToProps)(CardPresentation)

export default Card
