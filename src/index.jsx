import React from 'react'
import ReactDOM from 'react-dom'

import Loop from './loop'
import App from './components/app'
import * as Model from './model'

// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug')

const view = (state) =>
  <App state={state} />

const element = document.getElementById('app')

const render = (vdom) => {
  ReactDOM.render(vdom, element)
}

const init = () => {
  const model = Model.empty
  const recentDocs = Model.getRecentDocs()

  if(recentDocs.length > 0) {
    model.requestedDocId = recentDocs[0]
  }

  Loop.init(model, view, render)
  Loop.dispatch(Model.init)
}

init()
