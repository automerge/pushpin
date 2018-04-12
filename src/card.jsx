import React from 'react'
import Rnd from 'react-rnd'
import InlineEditor from './inline-editor'

const style = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 15,
  background: '#ff7eb9',
}

const resizeAvailable = {
  bottomRight: true,
  top: false, right: false, bottom: false, left: false,
  topRight: false, bottomLeft: false, topLeft: false
}

const presentation = ({ card, onDragStop, onResizeStop }) => {
  return (
  <Rnd
    style={style}
    size={{ width: card.get('width'), height: card.get('height') }}
    enableResizing={resizeAvailable}
    position={{ x: card.get('x'), y: card.get('y') }}
    onDragStop={(e, d) => { onDragStop(card.get('id'), d) }}
    onResizeStop={(e, direction, ref, delta, position) => { onResizeStop(card.get('id'), ref) }}
  >
    <InlineEditor />
  </Rnd>
  )
}

export default presentation
