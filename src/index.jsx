import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { RootState, Reducer } from './reducers'
import Board from './board'
import { INITIALIZE_IF_EMPTY } from './action-types'

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

init()
