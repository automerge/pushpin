import React from 'react'
import ReactDOM from 'react-dom'

import Loop from './loop'
import App from './components/app'
import * as Model from './model'
import { ipcRenderer } from 'electron'

// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug')

ipcRenderer.on("newDocument", () => {
  Loop.dispatch(Model.newDocument)
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
