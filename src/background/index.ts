import raf from 'random-access-file'

// const DiscoverySwarm = require('discovery-swarm')
// const defaults = require('dat-swarm-defaults')
import DiscoverySwarm from 'discovery-cloud-client'
import { RepoBackend } from 'hypermerge'
import { ToBackendRepoMsg } from 'hypermerge/dist/RepoMsg'
import { Socket } from 'net'
import ipc from '../ipc'
import { HYPERMERGE_PATH, FILE_SERVER_PATH } from '../renderer/constants'

window._debug = {}

const back = new RepoBackend({ storage: raf, path: HYPERMERGE_PATH })
const url = 'wss://discovery-cloud.herokuapp.com'
const discovery = new DiscoverySwarm({ url, id: back.id, stream: back.stream })

back.setSwarm(discovery as any)
back.startFileServer(FILE_SERVER_PATH)
window._debug.repo = back
window._debug.discovery = discovery

ipc.config.id = 'background'

ipc.serve(() => {
  ipc.server.on('repo.msg', (msg: ToBackendRepoMsg) => {
    back.receive(msg)
  })

  ipc.server.on('connect', (socket: Socket) => {
    back.subscribe((msg) => ipc.server.emit(socket, 'repo.msg', msg))
  })
})

ipc.server.start()
