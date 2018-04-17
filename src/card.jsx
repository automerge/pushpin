import React from 'react'
import { connect } from 'react-redux'
import { DraggableCore } from 'react-draggable'
import classNames from 'classnames'

import InlineEditor from './inline-editor'
import { CARD_DRAG_STARTED, CARD_DRAG_MOVED, CARD_DRAG_STOPPED } from './action-types'

const textInnerPresentation = (card) => {
  return (
  <InlineEditor
    cardId={card.get('id')}
    editorState={card.get('editorState')}
    createFocus={card.get('selected')}
  />
  )
}

const imageInnerPresentation = (card) => {
  return (
  <img
    className='image'
    src={card.get('path')}
  />
  )
}

const presentation = ({ card, onMouseDown, onStart, onDrag, onStop }) => {
  return (
  <DraggableCore
    allowAnyClick={false}
    disabled={false}
    enableUserSelectHack={false}
    onStart={(e, d) => onStart(card, e, d)}
    onDrag={(e, d) => onDrag(card, e, d)}
    onStop={(e, d) => onStop(card, e, d)}
    onMouseDown={(e) => onMouseDown(card, e)}
  >
    <div
      className={classNames('card', card.get('selected') ? 'selected' : 'unselected')}
      style={{
        width: card.get('width'),
        height: card.get('height'),
        position: 'absolute',
        left: card.get('x'),
        top: card.get('y')
      }}>
      { card.get('type') === 'text' ? textInnerPresentation(card) : imageInnerPresentation(card) }
      <span className='cardResizeHandle' />
    </div>
  </DraggableCore>
  )
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
      dispatch({ type: CARD_DRAG_STARTED, id: card.get('id'), x: d.lastX, y: d.lastY })
      console.log('card.onStart.finish')
    },
    onDrag: (card, e, d) => {
      if (d.deltaX != 0 || d.deltaY != 0) {
        dispatch({ type: CARD_DRAG_MOVED, id: card.get('id'), deltaX: d.deltaX, deltaY: d.deltaY })
      }
    },
    onStop: (card, e, d) => {
      if (d.deltaX != 0 || d.deltaY != 0) {
        throw new Error(`Did not expect delta in onStart`)
      }
      console.log('card.onStop.start')
      dispatch({ type: CARD_DRAG_STOPPED, id: card.get('id') })
      console.log('card.onStop.finish')
    }
  }
}

const Card = connect(null, mapDispatchToProps)(presentation)

export default Card
