import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import { RootState, Reducer } from './model'
import { INITIALIZE_IF_EMPTY, CARD_DELETED } from './action-types'
import Board from './board'

const onKeyDown = (e, store) => {
  if (e.key !== 'Backspace') {
    return
  }
  const state = store.getState()
  state.get('cards').forEach((card, idx) => {
    if (card.get('selected') && (card.get('type') !== 'text')) {
      store.dispatch({ type: CARD_DELETED, id: card.get('id') })
    }
  })
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

  const board = document.getElementById('board')
  window.scrollTo(
    (board.clientWidth/2)-(window.innerWidth/2),
    (board.clientHeight/2.5)-(window.innerHeight/2)
  )
}

init()
