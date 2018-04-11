import React from 'react'
import { connect } from 'react-redux'
import Card from './card'
import { CARD_RESIZED, CARD_DRAG_STOPPED } from './action-types'

const presentation = ({ cards, onResize, onDragStop }) => {
  return (
  <div id='board'>
    {cards.valueSeq().map(card =>
      <Card
        key={card.get('id')}
        card={card}
        onResize={onResize}
        onDragStop={onDragStop}
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
    onResize: (id, ref, position) => {
      dispatch({type: CARD_RESIZED, id: id, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y})
    }
  }
}

const connected = connect(mapStateToProps, mapDispatchToProps)(presentation)

export default connected
