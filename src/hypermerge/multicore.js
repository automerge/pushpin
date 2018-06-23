const { EventEmitter } = require('events')
const HypercoreProtocol = require('hypercore-protocol')
const raf = require('random-access-file')
const path = require('path')
const Hypercore = require('hypercore')
const crypto = require('hypercore/lib/crypto')
const discoverySwarm = require('discovery-swarm')
const swarmDefaults = require('dat-swarm-defaults')
const toBuffer = require('to-buffer')
const Debug = require('debug')

const log = Debug('hypermerge:multicore')

// Notes:
// * discovery keys := digest('hypercore', publicKey)
// * this.archiver.feeds indexed by discovery key, hex string representation
// * appends change (just adds?) to a feed (where exactly?) for each tracked core
// * replication??
class Multicore extends EventEmitter {
  constructor(storage, { port } = {}) {
    super()
    log('constructor', storage)

    this.port = port
    this.storage = defaultStorage(storage)

    this.isReady = false
    this.feeds = {} // dk -> Feed
    this.index = {
      discoveryKeys: {} // discoveryKey -> Boolean
    }

    readAll(this.storage.index(), (err, buff) => {
      if (err) {
        console.error('could not read index', err)
        // TODO emit error
        return
      }

      if (buff.length !== 0) {
        this.index = JSON.parse(buff)
        // TODO catch parsing errors and emit 'error'
      }

      this.isReady = true
      this.emit('ready')
    })
  }

  ready(cb) {
    if (this.isReady) {
      cb()
    } else {
      this.on('ready', cb)
    }
  }

  hypercore(key = null, opts = {}) {
    this._ensureReady()
    log('hypercore', key && key.toString('hex'))

    // Create a key pair if we're making a feed from scratch.
    if (!key) {
      const keyPair = crypto.keyPair()
      key = keyPair.publicKey
      opts.secretKey = keyPair.secretKey
    }

    log('hypercore key', key)

    const dk = Hypercore.discoveryKey(toBuffer(key, 'hex')).toString('hex')

    if (this.feeds[dk]) {
      return this.feeds[dk]
    }

    this._addDiscoveryKey(dk)

    const feed = Hypercore(this._feedStorage(dk), key, opts)
    this.feeds[dk] = feed

    return feed
  }

  hypercoreFromDiscoveryKey(dk, opts = {}) {
    if (this.feeds[dk]) {
      return this.feeds[dk]
    }

    if (!this.index.discoveryKeys[dk]) {
      throw new Error('Trying to open discoveryKey for feed without a publicKey')
    }

    const feed = Hypercore(this._feedStorage(dk), opts)
    this.feeds[dk] = feed

    return feed
  }

  joinSwarm(opts = {}) {
    this._ensureReady()

    log('joinSwarm')

    this.swarm = discoverySwarm(swarmDefaults(Object.assign({
      port: this.port,
      hash: false,
      encrypt: true,
      stream: info => this.replicate(info)
    }, opts)))

    Object.keys(this.index.discoveryKeys)
      .forEach(dk => {
        log('swarm existing dk', dk)
        this.swarm.join(toBuffer(dk, 'hex'))
      })

    this.swarm.listen(this.port)

    this.swarm.once('error', err => {
      log('joinSwarm.error', err)
      this.swarm.listen()
    })

    return this
  }

  // Returns a RandomAccessStorage function for the given hex discovery key.
  // Uses git-style ab/cd/* namespacing and passes that to the underlying
  // storage function given in the constructor.
  _feedStorage(dk) {
    const prefix = `${dk.slice(0, 2)}/${dk.slice(2, 4)}/${dk.slice(4)}/`
    return name => this.storage.feeds(prefix + name)
  }


  replicate(opts = {}) {
    this._ensureReady()
    log('replicate', opts)

    if (opts.discoveryKey) {
      opts.discoveryKey = toBuffer(opts.discoveryKey, 'hex')
    }

    if (opts.key) {
      opts.discoveryKey = Hypercore.discoveryKey(toBuffer(opts.key, 'hex'))
    }

    const stream = HypercoreProtocol({
      live: true,
      // TODO store a peer id in the multicore.json and set here `id: this.index.id`
      encrypt: opts.encrypt,
      extensions: ['hypermerge'] // TODO replace this with 'multicore' and pull messaging into here
    })

    stream.on('feed', this._feedRequested(stream))

    if (opts.channel) {
      this._addDiscoveryKey(opts.channel)
      // TODO figure out when channel can be missing
    }


    return stream
  }

  _ensureReady() {
    if (!this.isReady) {
      throw new Error('The MultiCore instance is not ready yet. Use .ready(cb) first.')
    }
  }

  _feedRequested(stream) {
    return discoveryKey => {
      const dk = discoveryKey.toString('hex')
      log('_feedRequested', dk)

      if (stream.destroyed) {
        return
      }

      if (this.index.discoverykeys[dk]) {
        this._replicateFeed(stream, this.hypercoreFromDiscoveryKey(dk))
      } else {
        throw new Error(`Unkown feed requested by peer: ${dk}`) // TODO what should we do in this situation?
      }
    }
  }

  _replicateFeed(stream, feed) {
    log('_replicateFeed')

    feed.replicate({
      stream,
      live: true
    })
  }

  // Index related thing below

  _addDiscoveryKey(dk) {
    if (!this.index.discoveryKeys[dk]) {
      this.index.discoveryKeys[dk] = true

      if (this.swarm) {
        log('swarm new dk', dk)
        this.swarm.join(toBuffer(dk, 'hex'))
      }

      this._writeIndex()
    }
  }

  _writeIndex() {
    // TODO write index to disk
  }
}

module.exports = Multicore

function defaultStorage(st) {
  if (typeof st === 'string') {
    return {
      index() {
        return raf(path.join(st, 'multicore.json'))
      },
      feeds(name) {
        return raf(path.join(st, 'feeds', name))
      }
    }
  }

  if (typeof st === 'function') {
    return {
      index() {
        return st('multicore.json')
      },
      feeds(name) {
        return st(`feeds/${name}`)
      }
    }
  }

  return st
}

function readAll(st, cb) {
  st.stat((err, stat) => {
    if (err) {
      return cb(null, Buffer.from(''))
    }
    st.read(0, stat.size, cb)
  })
}
