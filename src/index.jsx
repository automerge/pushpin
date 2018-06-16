import React from 'react'
import ReactDOM from 'react-dom'
import { EventEmitter } from 'events'
import Fs from 'fs'

import { HYPERMERGE_PATH, WORKSPACE_URL_PATH } from './constants'
import Hypermerge from './hypermerge'
import Content from './components/content'

// We load these modules here so that the content registry will have them.
import './components/workspace'

import './components/board' // board in workspace
import './components/board-link' // board in board
import './components/doc-link' // board in list

import './components/title-bar' // not really content?
import './components/share' // not really content
import './components/settings' // not really content?

import './components/board-title' // generic title editor... hmmm.

import './components/contact' // contact in list
import './components/mini-avatar' // contact in thread (?)

// how do these show up in lists? write a generic answer?
import './components/code-mirror-editor' // TextContent default
import './components/image-card' // ImageContent
import './components/thread' // default thread view
import './components/toggle' // default toggle view
import './components/url' // default url view

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

function loadWorkspaceUrl() {
  if (Fs.existsSync(WORKSPACE_URL_PATH)) {
    const json = JSON.parse(Fs.readFileSync(WORKSPACE_URL_PATH))
    // the next four lines are to cover a migration for existing accounts to URLs
    // if you're reading this long after 6/11/18 go ahead and delete this bit
    if (json.workspaceDocId) {
      const workspaceUrl = createDocumentLink('workspace', json.workspaceDocId)
      saveWorkspaceUrl(workspaceUrl) // upgrade to new format
      return workspaceUrl
    } else if (json.workspaceUrl) {
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
  const workspace = <Content url={workspaceUrl} />
  const element = document.getElementById('workspace')
  ReactDOM.render(workspace, element)
}

initHypermerge(() => {
  initWorkspace()
})
