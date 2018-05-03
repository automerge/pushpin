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
  Loop.init(Model.empty, view, render)
  Loop.dispatch(Model.init)
}

init()
