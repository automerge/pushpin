import React from 'react'
import ReactDOM from 'react-dom'

import Loop from './loop'
import App from './components/app'
import Content from './components/content'
import * as Model from './models/model'

// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug')

const view = (state) => {
  if (window.hm && state.workspace) {
    return <Content state={state} card={{ type: 'app', docId: window.hm.getId(state.workspace) }} />
  }
  return <p>Loading...</p>
}

const element = document.getElementById('app')

const render = (vdom) => {
  ReactDOM.render(vdom, element)
}

const init = () => {
  Loop.init(Model.empty, view, render)
  Loop.dispatch(Model.init)
}

init()
