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
    className={ card.get('selected') ? 'selected' : 'unselected' }
    size={{ width: card.get('width'), height: card.get('height') }}
    enableResizing={resizeAvailable}
    position={{ x: card.get('x'), y: card.get('y') }}
    onDragStop={(e, d) => { onDragStop(card.get('id'), d) }}
    onResizeStop={(e, direction, ref, delta, position) => { onResizeStop(card.get('id'), ref) }}
  >
    <InlineEditor
      cardId={card.get('id')}
      editorState={card.get('editorState')}
      createFocus={card.get('selected')}
    />
  </Rnd>
  )
}

export default presentation
