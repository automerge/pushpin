import { Repo } from 'hypermerge/dist/Repo'
import raf from 'random-access-file'
// import discoverySwarm from "discovery-swarm"
// import datDefaults from "dat-swarm-defaults"
import DiscoveryCloud from 'discovery-cloud-client'
import program from 'commander'
import * as CloudPeer from './CloudPeer'
import * as ShareLink from '../renderer/ShareLink'

// Program config

let rootDataUrl: string | undefined

program
  .description('A cloud peer for pushpin to keep data warm while your computer is sleeping.')
  .arguments('<rootDataUrl>')
  .action((dataUrl?: string) => {
    rootDataUrl = dataUrl
  })
  .parse(process.argv)

// TODO: validate hypermerge url
// typeof check to satisfy Typescript.
if (typeof rootDataUrl === 'undefined' || !ShareLink.isHypermergeUrl(rootDataUrl)) {
  throw new Error('Must provide a valid root data url')
}

// Repo init
const storagePath = process.env.REPO_ROOT || './.data'
const repo = new Repo({ storage: raf, path: storagePath })
repo.replicate(
  // discoverySwarm(
  //   datDefaults({
  //     port: 0,
  //     id: repo.id,
  //     stream: repo.stream,
  //   }),
  // ),
  new DiscoveryCloud({
    url: 'wss://discovery-cloud.herokuapp.com',
    id: repo.id,
    stream: repo.stream,
  })
)

// CloudPeer init

const cloudPeer = new CloudPeer.CloudPeer(repo)
cloudPeer.swarm(rootDataUrl)
