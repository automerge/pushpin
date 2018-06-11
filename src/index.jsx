import React from 'react'
import ReactDOM from 'react-dom'
import { EventEmitter } from 'events'
import Fs from 'fs'

import { HYPERMERGE_PATH, WORKSPACE_ID_PATH } from './constants'
import Hypermerge from './hypermerge'
import Content from './components/content'

// We load these modules here so that the content registry will have them.
import './components/board'
import './components/board-title'
import './components/code-mirror-editor'
import './components/contact'
import './components/doc-link'
import './components/image-card'
import './components/mini-avatar'
import './components/settings'
import './components/share'
import './components/thread'
import './components/title-bar'
import './components/toggle'
import './components/workspace'

import { createDocumentLink } from './share-link'

// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug')

// It's normal for a document with a lot of participants to have a lot of
// connections, so increase the limit to avoid spurious warnings about
// emitter leaks.
EventEmitter.defaultMaxListeners = 500

function initHypermerge(cb) {
  window.hm = new Hypermerge({ storage: HYPERMERGE_PATH, port: 0 })
  window.hm.once('ready', () => {
    window.hm.joinSwarm()
    cb()
  })
}

function loadWorkspaceId() {
  if (Fs.existsSync(WORKSPACE_ID_PATH)) {
    const json = JSON.parse(Fs.readFileSync(WORKSPACE_ID_PATH))
    if (json.workspaceDocId) {
      return json.workspaceDocId
    }
  }
  return ''
}

function saveWorkspaceId(docId) {
  const workspaceIdFile = { workspaceDocId: docId }
  Fs.writeFileSync(WORKSPACE_ID_PATH, JSON.stringify(workspaceIdFile))
}

function initWorkspace() {
  let workspaceId
  const existingWorkspaceId = loadWorkspaceId()
  if (existingWorkspaceId !== '') {
    workspaceId = existingWorkspaceId
  } else {
    const newWorkspaceId = Content.initializeContentDoc('workspace')
    saveWorkspaceId(newWorkspaceId)
    workspaceId = newWorkspaceId
  }
  const workspace = <Content url={createDocumentLink('workspace', workspaceId)} />
  const element = document.getElementById('workspace')
  ReactDOM.render(workspace, element)
}

initHypermerge(() => {
  initWorkspace()
})
