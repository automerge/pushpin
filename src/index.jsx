import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import { RootState, Reducer } from './model'
import { INITIALIZE_IF_EMPTY } from './action-types'
import SimpleEditor from './simple-editor'
import Board from './board'

const init = () => {
  const store = createStore(Reducer, RootState)
  store.dispatch({type: INITIALIZE_IF_EMPTY})
  render(store)
}

const render = (store) => {
  ReactDOM.render(
    <Provider store={store}>
      <div>
        <Board />
      </div>
    </Provider>,
    document.getElementById('container')
  )
}

const initTest = () => {
  const store = createStore(Reducer, RootState)
  store.dispatch({type: INITIALIZE_IF_EMPTY})
  ReactDOM.render(
    <SimpleEditor />,
    document.getElementById('container')
  )
}
initTest()
