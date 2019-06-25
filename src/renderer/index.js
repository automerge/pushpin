import React from 'react'
import ReactDOM from 'react-dom'
import { EventEmitter } from 'events'
import Fs from 'fs'
import { RepoFrontend, RepoBackend } from 'hypermerge'
import raf from 'random-access-file'
// const DiscoverySwarm = require('discovery-swarm')
// const defaults = require('dat-swarm-defaults')
import DiscoverySwarm from 'discovery-cloud-client'

import { HYPERMERGE_PATH, WORKSPACE_URL_PATH } from './constants'
import Content from './components/content'

// We load these modules here so that the content registry will have them.
import './components/workspace/workspace'

// default context components
import './components/defaults/default-in-list'

// board in various contexts
import './components/board'
import './components/contact'

// other single-context components
import './components/text-content'
import './components/image-content'
import './components/thread-content'
import './components/url-content'
import './components/pdf-content'

import { createDocumentLink } from './share-link'

require('./app.css')
require('./components/react-simple-dropdown/dropdown.css')
require('../../node_modules/@ibm/plex/css/ibm-plex.css')
require('../../node_modules/codemirror/lib/codemirror.css')
require('./line-awesome/fonts/line-awesome.ttf')
require('./line-awesome/fonts/line-awesome.woff')
require('./line-awesome/fonts/line-awesome.woff2')
require('./line-awesome/css/line-awesome.min.css')

// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug')

// It's normal for a document with a lot of participants to have a lot of
// connections, so increase the limit to avoid spurious warnings about
// emitter leaks.
EventEmitter.defaultMaxListeners = 500

function initBackend(front) {
  const back = new RepoBackend({ storage: raf, path: HYPERMERGE_PATH, port: 0 })

  back.subscribe((msg) => front.receive(JSON.parse(JSON.stringify(msg))))
  front.subscribe((msg) => back.receive(JSON.parse(JSON.stringify(msg))))
  const url = 'wss://discovery-cloud.herokuapp.com'
  const discovery = new DiscoverySwarm({ url, id: back.id, stream: back.stream })

  back.replicate(discovery)
}

function initHypermerge(cb) {
  const front = new RepoFrontend()
  initBackend(front)
  // const discovery = new DiscoverySwarm(defaults({ stream: repo.stream, id: repo.id }))

  window.repo = front

  cb() // no need to wait for .ready?
}

function loadWorkspaceUrl() {
  if (Fs.existsSync(WORKSPACE_URL_PATH)) {
    const json = JSON.parse(Fs.readFileSync(WORKSPACE_URL_PATH))
    // the next four lines are to cover a migration for existing accounts to URLs
    // if you're reading this long after 6/11/18 go ahead and delete this bit
    if (json.workspaceDocId) {
      const workspaceUrl = createDocumentLink('workspace', json.workspaceDocId)
      saveWorkspaceUrl(workspaceUrl) // upgrade to new format
      return workspaceUrl
    }
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

function initWorkspace() {
  let workspaceUrl
  const existingWorkspaceUrl = loadWorkspaceUrl()
  if (existingWorkspaceUrl !== '') {
    workspaceUrl = existingWorkspaceUrl
  } else {
    const newWorkspaceId = Content.initializeContentDoc('workspace')
    const newWorkspaceUrl = createDocumentLink('workspace', newWorkspaceId)
    saveWorkspaceUrl(newWorkspaceUrl)
    workspaceUrl = newWorkspaceUrl
  }
  const workspace = <Content context="workspace" url={workspaceUrl} />
  const element = document.getElementById('app')
  ReactDOM.render(workspace, element)
}

initHypermerge(() => {
  initWorkspace()
})
