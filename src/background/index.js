/* eslint-disable */
console.log("Starting background process...")
console.log(process.argv)

const HYPERMERGE_PATH = process.argv[2]

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

filteredLog = (msg) => {
  if (msg.type === 'DocumentMessage') {
    return
  }
  console.log('->', JSON.stringify(msg))
}

back.subscribe((msg) => filteredLog(msg) && process.send(JSON.stringify(msg)))
process.on('message', message => {
  const parsed = JSON.parse(message)
  if (parsed.type === 'DocumentMessage') {
    return
  }
  console.log("<-", message)
  back.receive(parsed)
})

console.log("Background process begun.")