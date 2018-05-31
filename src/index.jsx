import React from 'react'
import ReactDOM from 'react-dom'

import Loop from './loop'
import Content from './components/content'
import * as Model from './models/model'

// We load these modules here so that the content registry will have them
// and we supppress the eslint warning just for this file here.
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "[A-Z]\w+" }] */
import App from './components/app'
import Board from './components/board'
import ImageCard from './components/image-card'
import CodeMirrorEditor from './components/code-mirror-editor'
import TitleBar from './components/title-bar'
import BoardTitle from './components/board-title'
import Toggle from './components/toggle'
import Contact from './components/contact'
import Share from './components/share'
import Settings from './components/settings'

// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug')

const view = (state) => {
  if (window.hm && state.workspace) {
    return <Content state={state} type="app" docId={window.hm.getId(state.workspace)} />
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
