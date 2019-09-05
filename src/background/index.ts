import raf from 'random-access-file'

// const DiscoverySwarm = require('discovery-swarm')
// const defaults = require('dat-swarm-defaults')
import DiscoverySwarm from 'discovery-cloud-client'

import { RepoBackend } from 'hypermerge'
import ipc from 'node-ipc'

import { ToBackendRepoMsg } from 'hypermerge/dist/RepoMsg'
import { Socket } from 'net'
import { HYPERMERGE_PATH } from '../renderer/constants'

const back = new RepoBackend({ storage: raf, path: HYPERMERGE_PATH })
const url = 'wss://discovery-cloud.herokuapp.com'
const discovery = new DiscoverySwarm({ url, id: back.id, stream: back.stream })

back.setSwarm(discovery as any)

ipc.config.silent = true
ipc.config.appspace = 'pushpin.'
ipc.config.id = 'background'
ipc.config.maxConnections = 1

ipc.serve(() => {
  ipc.server.on('repo.msg', (msg: ToBackendRepoMsg) => {
    back.receive(msg)
  })

  ipc.server.on('connect', (socket: Socket) => {
    back.subscribe((msg) => ipc.server.emit(socket, 'repo.msg', msg))
  })
})

ipc.server.start()
