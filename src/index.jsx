import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import { RootState, Reducer } from './model'
import { INITIALIZE_IF_EMPTY, CARD_DELETED } from './action-types'
import Board from './board'

var spaceDown = false

const onKeyDown = (e, store) => {
  if (e.key === 'Backspace') {
    const state = store.getState()
    state.get('cards').forEach((card, idx) => {
      if (card.get('selected') && (card.get('type') !== 'text')) {
        store.dispatch({ type: CARD_DELETED, id: card.get('id') })
      }
    })
    return
  }

  if (e.key === ' ' && e.target === document.body) {
    spaceDown = true
    e.preventDefault()
    return
  }
}

const onKeyUp = (e) => {
  if (e.key === ' ' && e.target === document.body) {
    spaceDown = false
    return
  }
}

const onMouseMove = (e) => {
  if (spaceDown) {
    window.scrollBy(e.movementX*2, e.movementY*2)
  }
}

const init = () => {
  const store = createStore(Reducer, RootState)
  store.dispatch({type: INITIALIZE_IF_EMPTY})
  ReactDOM.render(
    <Provider store={store}>
      <Board />
    </Provider>,
    document.getElementById('container')
  )
  document.addEventListener('keydown', (e) => { onKeyDown(e, store) })
  document.addEventListener('keyup', (e) => { onKeyUp(e) })
  document.addEventListener('mousemove', e => { onMouseMove(e) })

  const board = document.getElementById('board')
  window.scrollTo(
    (board.clientWidth/2)-(window.innerWidth/2),
    (board.clientHeight/2.5)-(window.innerHeight/2)
  )
}

init()
