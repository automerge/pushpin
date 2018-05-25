import React from 'react'
import ReactDOM from 'react-dom'
import { ipcRenderer } from 'electron'

import Loop from './loop'
import App from './components/app'
import * as Model from './models/model'

// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug')

// should this be here?
ipcRenderer.on('newDocument', () => {
  // eventually we may want to decide contextually how to interpret this
  // but for now, we can just make a new board and trust the app will open it
  // pvh broke this too
  // Loop.dispatch(Board.create)
})

const view = (state) =>
  <App state={state} />

const element = document.getElementById('app')

const render = (vdom) => {
  ReactDOM.render(vdom, element)
}

const init = () => {
  Loop.init(Model.empty, view, render)
  Loop.dispatch(Model.init)
}

init()
