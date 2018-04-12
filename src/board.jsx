import React from 'react'
import { connect } from 'react-redux'
import Card from './card'
import { CARD_DRAG_STOPPED, CARD_RESIZED, CARD_RESIZE_STOPPED } from './action-types'

const presentation = ({ cards, onDragStop, onResize, onResizeStop }) => {
  return (
  <div id='board' style={{width: 2900, height: 1200, background: '#e8e8ee'}}>
    {cards.valueSeq().map(card =>
      <Card
        key={card.get('id')}
        card={card}
        onDragStop={onDragStop}
        onResize={onResize}
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
    onResize: (id, ref) => {
      dispatch({type: CARD_RESIZED, id: id, width: ref.offsetWidth, height: ref.offsetHeight})
    },
    onResizeStop: (id, ref) => {
      dispatch({type: CARD_RESIZE_STOPPED, id: id, width: ref.offsetWidth, height: ref.offsetHeight})
    }
  }
}

const connected = connect(mapStateToProps, mapDispatchToProps)(presentation)

export default connected
