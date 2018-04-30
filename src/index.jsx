import React from 'react'
import ReactDOM from 'react-dom'
import Debug from 'debug'

import Loop from './loop'
import App from './components/app'
import * as Model from './model'


const view = (state) => {
  return <App state={state} />
}

const element = document.getElementById('app')

const render = (vdom) => {
  ReactDOM.render(vdom, element)
}

const init = () => {
  Debug.enable('')
  const state = Model.empty
  Loop.init(state, view, render)
  Loop.dispatch(Model.init)
}

init()
