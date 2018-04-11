import React from 'react'
import Rnd from 'react-rnd'

const style = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'solid 1px #ddd',
  background: '#f0f0f0',
}

const resizeAvailable = {
  bottomRight: true,
  top: false, right: false, bottom: false, left: false,
  topRight: false, bottomLeft: false, topLeft: false
}

const presentation = ({ card, onDragStop, onResize, onResizeStop }) => {
  return (
  <Rnd
    style={style}
    size={{ width: card.get('width'), height: card.get('height') }}
    enableResizing={resizeAvailable}
    position={{ x: card.get('x'), y: card.get('y') }}
    onDragStop={(e, d) => { onDragStop(card.get('id'), d) }}
    onResize={(e, direction, ref, delta, position) => { onResize(card.get('id'), ref) }}
    onResizeStop={(e, direction, ref, delta, position) => { onResizeStop(card.get('id'), ref) }}
  >
    { card.get('text') }
  </Rnd>
  )
}

export default presentation
