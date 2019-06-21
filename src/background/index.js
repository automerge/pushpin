/* eslint-disable */
console.log("Starting background process...")
console.log(process.argv)

import { HYPERMERGE_PATH } from '../renderer/constants'

const raf = require('random-access-file')
// const DiscoverySwarm = require('discovery-swarm')
// const defaults = require('dat-swarm-defaults')
const DiscoverySwarm =  require('discovery-cloud-client')

const mkdirp = require('mkdirp')
const hypermerge = require('hypermerge')

import { ipcRenderer } from 'electron'

const RepoBackend = hypermerge.RepoBackend // that aint right

const back = new RepoBackend({ storage: raf, path: HYPERMERGE_PATH, port: 0 })
const url = 'wss://discovery-cloud.herokuapp.com'
const discovery = new DiscoverySwarm.default({ url, id: back.id, stream: back.stream })

back.replicate(discovery)

ipcRenderer.on('backend', (event, message) =>  {
  console.log('heard', message)
  back.receive(JSON.parse(message))
})
back.subscribe((msg) => ipcRenderer.send('backend', JSON.stringify(msg)))

console.log("Background process begun.")