import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { webFrame } from 'electron'
import Hypermerge from 'hypermerge'
import RAM from 'random-access-memory'

import ExampleEditor from './example-editor'
import { RootState, Reducer } from './model'
import { INITIALIZE, CARD_DELETED, DOCUMENT_READY, DOCUMENT_UPDATED } from './action-types'
import Board from './board'

var spaceDown = false

const onKeyDown = (e, store) => {
  if (e.key === 'Backspace') {
    const state = store.getState()
    for (let id in state.board.cards) {
      const card = state.board.cards[id]
      if (card.selected && (card.type !== 'text')) {
        store.dispatch({ type: CARD_DELETED, id: card.id })
      }
    }
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

const onWheel = (e) => {
  if (e.deltaY === 0) {
    throw new Error('Unexpected non-zoom wheel')
  }

  const oldZoom = webFrame.getZoomFactor()
  const scaleFactor = (e.deltaY < 0) ? 0.95 : 1.05
  const newZoom = oldZoom * scaleFactor
  const offsetX = e.clientX * (1-(1/scaleFactor))
  const offsetY = e.clientY * (1-(1/scaleFactor))
  webFrame.setZoomFactor(newZoom)
  window.scrollBy(offsetX, offsetY)
  e.preventDefault()
}

const centerOnStart = () => {
  const board = document.getElementById('board')
  window.scrollTo(
    (board.clientWidth/2)-(window.innerWidth/2),
    (board.clientHeight/2.5)-(window.innerHeight/2)
  )
}

const init = () => {
  const hm = new Hypermerge({path: RAM, port: 0})
  hm.once('ready', function() {
    hm.joinSwarm()

    const store = createStore(Reducer(hm), RootState)

    hm.on('document:ready', (docId, doc) => {
      store.dispatch({type: DOCUMENT_READY, docId: docId, doc: doc})
    })
    hm.on('document:updated', (docId, doc) => {
      store.dispatch({type: DOCUMENT_UPDATED, docId: docId, doc: doc})
    })

    store.dispatch({type: INITIALIZE})
    render(store)
  })
}

const render = (store) => {
  ReactDOM.render(
    <Provider store={store}>
      <Board />
    </Provider>,
    document.getElementById('container')
  )

  document.addEventListener('keydown', (e) => { onKeyDown(e, store) })
  document.addEventListener('keyup', (e) => { onKeyUp(e) })
  document.addEventListener('mousemove', (e) => { onMouseMove(e) })
  document.addEventListener('wheel', (e) => { onWheel(e) })

  centerOnStart()
}

const initEditor = () => {
  ReactDOM.render(
    <ExampleEditor
      selected={true}
      initialText={'# Welcome\n\nLet us try some initial text.'}
    />,
    document.getElementById('container')
  )
}

init()
