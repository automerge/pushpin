import React from 'react'
import Rnd from 'react-rnd'

const style = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'solid 1px #ddd',
  background: '#f0f0f0',
};

const presentation = ({ card, onResize, onDragStop }) => {
  return (
  <Rnd
    style={style}
    size={{ width: card.get('width'), height: card.get('height') }}
    position={{ x: card.get('x'), y: card.get('y') }}
    onDragStop={(e, d) => { onDragStop(card.get('id'), d) }}
    onResize={(e, direction, ref, delta, position) => { onResize(card.get('id'), ref, position) }}
  >
    { card.get('text') }
  </Rnd>
  )
}

export default presentation
