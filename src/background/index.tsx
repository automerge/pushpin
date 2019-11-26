import fs from 'fs'
import gracefulFs from 'graceful-fs'

import Hyperswarm from 'hyperswarm'
import * as ReactDOM from 'react-dom'
import React from 'react'

import { RepoBackend, DocUrl } from 'hypermerge'

import { ToBackendRepoMsg } from 'hypermerge/dist/RepoMsg'
import { Socket } from 'net'
// import Client from 'discovery-cloud'
import ipc from '../ipc'
import { HYPERMERGE_PATH, FILE_SERVER_PATH } from '../renderer/constants'
import Root from './components/Root'
import { ToSystemMsg } from '../renderer/System'

gracefulFs.gracefulify(fs)

window._debug = {}

const back = new RepoBackend({ path: HYPERMERGE_PATH })

// const cloud = new Client({ url: 'wss://pushpin-relay.herokuapp.com' })
const swarm = Hyperswarm({
  queue: {
    multiplex: true,
  },
})

back.addSwarm(swarm)
// back.addSwarm(cloud)

back.startFileServer(FILE_SERVER_PATH)
window._debug.repo = back
window._debug.swarm = swarm

ipc.config.id = 'background'

ipc.serve(() => {
  ipc.server.on('repo.msg', (msg: ToBackendRepoMsg) => {
    back.receive(msg)
  })

  ipc.server.on('system.msg', (msg: ToSystemMsg) => {
    switch (msg.type) {
      case 'Navigated':
        mount(msg.url, Root)
        break
    }
  })

  ipc.server.on('connect', (socket: Socket) => {
    back.subscribe((msg) => ipc.server.emit(socket, 'repo.msg', msg))
  })
})

ipc.server.start()

const container = document.createElement('div')
container.id = 'app'
document.body.appendChild(container)

let currentUrl: DocUrl
function mount(url: DocUrl, NewRoot: typeof Root) {
  currentUrl = url
  try {
    ReactDOM.render(<NewRoot repo={back} currentUrl={url} />, container)
  } catch (e) {
    console.error('mount error', e) // eslint-disable-line
  }
}

// HMR
if (module.hot) {
  module.hot.accept('./components/Root.tsx', () => {
    const NextRoot = require('./components/Root').default // eslint-disable-line global-require
    mount(currentUrl, NextRoot)
  })
}
