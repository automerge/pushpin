import React from 'react'
import { connect } from 'react-redux'
import Card from './card'
import { CARD_DRAG_STOPPED, CARD_RESIZE_STOPPED, CARD_CREATED } from './action-types'

const style = {
  width: 2410,
  height: 1000,
  background: '#e8e8ee'
}

const presentation = ({ cards, onDrag, onDragStop, onResize, onResizeStop, onDoubleClick }) => {
  return (
  <div
    id='board'
    onDoubleClick={onDoubleClick}
    style={style}>
    {cards.valueSeq().map(card =>
      <Card
        key={card.get('id')}
        card={card}
        onDragStop={onDragStop}
        onResizeStop={onResizeStop}
      />
    )}
  </div>
  )
}

const mapStateToProps = (state) => {
  return {cards: state.get('cards')}
}

const mapDispatchToProps = (dispatch) => {
  return {
    onDragStop: (id, d) => {
      dispatch({type: CARD_DRAG_STOPPED, id: id, x: d.x, y: d.y})
    },
    onResizeStop: (id, ref) => {
      dispatch({type: CARD_RESIZE_STOPPED, id: id, width: ref.offsetWidth, height: ref.offsetHeight})
    },
    onDoubleClick: (e) => {
      dispatch({type: CARD_CREATED, x: e.pageX, y: e.pageY})
    }
  }
}

const connected = connect(mapStateToProps, mapDispatchToProps)(presentation)

export default connected
