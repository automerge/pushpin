import React from 'react'
import ReactDOM from 'react-dom'
import { EventEmitter } from 'events'
import ipc from 'node-ipc'
import Fs from 'fs'
import { RepoFrontend } from 'hypermerge'
import { ToFrontendRepoMsg } from 'hypermerge/dist/RepoMsg'
import { WORKSPACE_URL_PATH } from './constants'
import Root from './components/Root'

import './app.css'
import './react-toggle-override.css'
import 'react-simple-dropdown/dropdown.css'
import './ibm-plex.css'
import 'line-awesome/css/line-awesome.min.css'
import ContentTypes from './ContentTypes'

window._debug = {}

// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug')

// It's normal for a document with a lot of participants to have a lot of
// connections, so increase the limit to avoid spurious warnings about
// emitter leaks.
EventEmitter.defaultMaxListeners = 500

ipc.config.silent = true
ipc.config.appspace = 'pushpin.'
ipc.config.id = 'renderer'
ipc.config.maxRetries = 2 as any

function initHypermerge(cb: (repo: RepoFrontend) => void) {
  const front = new RepoFrontend()

  window._debug.repo = front

  ipc.connectTo('background', () => {
    ipc.of.background.on('repo.msg', (msg: ToFrontendRepoMsg) => {
      front.receive(msg)
    })

    front.subscribe((msg) => ipc.of.background.emit('repo.msg', msg))
  })

  // const discovery = new DiscoverySwarm(defaults({ stream: repo.stream, id: repo.id }))

  window.repo = front

  cb(front)
}

function loadWorkspaceUrl() {
  if (Fs.existsSync(WORKSPACE_URL_PATH)) {
    const json = JSON.parse(Fs.readFileSync(WORKSPACE_URL_PATH, { encoding: 'utf-8' }))
    if (json.workspaceUrl) {
      return json.workspaceUrl
    }
  }
  return ''
}

function saveWorkspaceUrl(workspaceUrl) {
  const workspaceUrlData = { workspaceUrl }
  Fs.writeFileSync(WORKSPACE_URL_PATH, JSON.stringify(workspaceUrlData))
}

function initWorkspace(repo: RepoFrontend) {
  let workspaceUrl
  const existingWorkspaceUrl = loadWorkspaceUrl()
  if (existingWorkspaceUrl !== '') {
    workspaceUrl = existingWorkspaceUrl
  } else {
    ContentTypes.create('workspace', {}, (newWorkspaceUrl) => {
      saveWorkspaceUrl(newWorkspaceUrl)
      workspaceUrl = newWorkspaceUrl
    })
  }

  const workspace = <Root repo={repo} url={workspaceUrl} />
  const element = document.createElement('div')
  element.id = 'app'
  document.body.appendChild(element)
  ReactDOM.render(workspace, element)

  // HMR
  if (module.hot) {
    module.hot.accept('./components/Root.tsx', () => {
      const NextRoot = require('./components/Root').default // eslint-disable-line global-require
      ReactDOM.render(<NextRoot repo={repo} url={workspaceUrl} />, element)
    })
  }
}

initHypermerge((repo: RepoFrontend) => {
  initWorkspace(repo)
})
