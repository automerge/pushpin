import raf from 'random-access-file'

// const DiscoverySwarm = require('discovery-swarm')
// const defaults = require('dat-swarm-defaults')
import DiscoverySwarm from 'discovery-cloud-client'

import { RepoBackend } from 'hypermerge'
import { ipcRenderer } from 'electron'

import { HYPERMERGE_PATH } from '../renderer/constants'

// console.log('Starting background process...')
// console.log(process.argv)

const back = new RepoBackend({ storage: raf, path: HYPERMERGE_PATH })
const url = 'wss://discovery-cloud.herokuapp.com'
const discovery = new DiscoverySwarm({ url, id: back.id, stream: back.stream })

back.replicate(discovery)

ipcRenderer.on('hypermerge', (_event: never, msg: any) => {
  back.receive(msg)
})
back.subscribe((msg) => ipcRenderer.send('to-frontend', msg))

// console.log('Background process begun.')
