/* eslint-disable */
console.log("Starting background process...")
console.log(process.argv)

const HYPERMERGE_PATH = process.argv[1]

const raf = require('random-access-file')
// const DiscoverySwarm = require('discovery-swarm')
// const defaults = require('dat-swarm-defaults')
const DiscoverySwarm =  require('discovery-cloud-client')

const hypermerge = require('hypermerge')
const RepoBackend = hypermerge.RepoBackend // that aint right

const back = new RepoBackend({ storage: raf, path: HYPERMERGE_PATH, port: 0 })
const url = 'wss://discovery-cloud.herokuapp.com'
const discovery = new DiscoverySwarm.default({ url, id: back.id, stream: back.stream })

back.replicate(discovery)

back.subscribe((msg) => console.log('->', message) && process.send(JSON.stringify(msg)))
process.on('message', message => {
  console.log("<-", message)
  back.receive(JSON.parse(message))
})

console.log("Background process begun.")