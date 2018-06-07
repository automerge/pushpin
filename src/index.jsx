import React from 'react'
import ReactDOM from 'react-dom'
import { EventEmitter } from 'events'
import Fs from 'fs'

import { HYPERMERGE_PATH, WORKSPACE_ID_PATH } from './constants'
import Hypermerge from './hypermerge'
import Content from './components/content'

// We load these modules here so that the content registry will have them
// and we supppress the eslint warning just for this file here.
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "[A-Z]\w+" }] */
import Workspace from './components/workspace'
import Board from './components/board'
import ImageCard from './components/image-card'
import PDFCard from './components/pdf-card'
import CodeMirrorEditor from './components/code-mirror-editor'
import TitleBar from './components/title-bar'
import BoardTitle from './components/board-title'
import Toggle from './components/toggle'
import Contact from './components/contact'
import Share from './components/share'
import Settings from './components/settings'
import BlackJack from './components/blackjack'
import DocLink from './components/doc-link'
import Whiteboard from './components/whiteboard'
import Chat from './components/chat'
import './components/browser'
import DrumKit from './components/drumkit.jsx'

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
