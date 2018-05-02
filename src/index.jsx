import Debug from 'debug'
// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug')

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { webFrame } from 'electron'
import Hypermerge from 'hypermerge'
import RAM from 'random-access-memory'

import { RootState, Reducer, processImage } from './model'
import { INITIALIZE_IF_EMPTY, CARD_DELETED, DOCUMENT_READY, DOCUMENT_UPDATED } from './action-types'
import HashForm from './components/hash-form'
import Board from './components/board'


const onKeyDown = (e, store) => {
  if (e.key === 'Backspace') {
    const state = store.getState()
    for (let id in state.board.cards) {
      const card = state.board.cards[id]
      if ((id === state.selected) && (card.type !== 'text')) {
        store.dispatch({ type: CARD_DELETED, id: card.id })
      }
    }
  }
}

const centerOnStart = () => {
  const board = document.getElementById('board')
  window.scrollTo((board.clientWidth/2)-(window.innerWidth/2), 0)
}

const init = () => {
  const hm = new Hypermerge({path: RAM, port: 0})
  hm.once('ready', function() {
    hm.joinSwarm()

    const store = createStore(Reducer(hm), RootState)

    hm.on('document:ready', (docId, doc) => {
      store.dispatch({type: DOCUMENT_READY, docId: docId, doc: doc})
      store.dispatch({type: INITIALIZE_IF_EMPTY})
      processImage(store.dispatch, "./img/kay.jpg", null, 1750, 500)
      processImage(store.dispatch, "./img/carpenters-workshop.jpg", null, 1800, 150)
    })

    hm.on('document:updated', (docId, doc) => {
      store.dispatch({type: DOCUMENT_UPDATED, docId: docId, doc: doc})
    })

    hm.create()

    render(store)
  })
}

const render = (store) => {
  ReactDOM.render(
    <Provider store={store}>
      <div>
        <HashForm />
        <Board />
      </div>
    </Provider>,
    document.getElementById('container')
  )

  document.addEventListener('keydown', (e) => { onKeyDown(e, store) })

  centerOnStart()
}

init()
