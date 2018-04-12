import React from 'react'
import { connect } from 'react-redux'
import Card from './card'
import { CARD_CREATED, CLEAR_SELECTIONS } from './action-types'

const style = {
  width: 2410,
  height: 1000,
  background: '#e8e8ee'
}

const presentation = ({ cards, onDrag, onDragStop, onResize, onResizeStop, onClick, onDoubleClick }) => {
  return (
  <div
    id='board'
    onClick={onClick}
    onDoubleClick={onDoubleClick}
    style={style}>
    {cards.valueSeq().map(card =>
      <Card
        key={card.get('id')}
        card={card}
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
    onClick: (e) => {
      dispatch({type: CLEAR_SELECTIONS})
    },
    onDoubleClick: (e) => {
      dispatch({type: CLEAR_SELECTIONS})
      dispatch({type: CARD_CREATED, x: e.pageX, y: e.pageY, selected: true})
    }
  }
}

const connected = connect(mapStateToProps, mapDispatchToProps)(presentation)

export default connected
