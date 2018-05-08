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
  Loop.init(Model.empty, view, render)
  Loop.dispatch(Model.init)
}

// This doesn't seem to work?
// We get in the logs "Uncaught (in promise) ..." but this code is not invoked.
// process.on('unhandledRejection', (err) => {
//   console.log('our unhandledRejection', err)
//   process.exit(1)
// })

init()
