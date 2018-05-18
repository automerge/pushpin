const { EventEmitter } = require('events')
const protocol = require('hypercore-protocol')
const Archiver = require('hypercore-archiver')
const hypercore = require('hypercore')
const crypto = require('hypercore/lib/crypto')
const thunky = require('thunky')
const toBuffer = require('to-buffer')

// Monkey-patch hypercore-archiver so we can create a Hypercore
// directly in the archive

Archiver.prototype.createFeed = function createFeed(key, opts) {
  const self = this
  opts = opts || {}
  if (!key) {
    // create key pair
    const keyPair = crypto.keyPair()
    key = keyPair.publicKey
    opts.secretKey = keyPair.secretKey
  }
  const dk = hypercore.discoveryKey(toBuffer(key, 'hex')).toString('hex')

  if (this.feeds[dk]) {
    return this.feeds[dk]
  }

  opts.sparse = this.sparse
  const feed = hypercore(storage(key), key, opts)
  this.feeds[dk] = feed

  this.changes.append({ type: 'add', key: key.toString('hex') })
  this.emit('add', feed)

  return feed

  // copied from hypercore-archiver.prototype._add()
  function storage(key) {
    const dk = hypercore.discoveryKey(key).toString('hex')
    const prefix = `${dk.slice(0, 2)}/${dk.slice(2, 4)}/${dk.slice(4)}/`

    return (name) => self.storage.feeds(prefix + name)
  }
}

class Multicore extends EventEmitter {
  constructor(storage, opts) {
    super()
    opts = opts || {}
    this.archiver = new Archiver(storage)
    this.ready = thunky(open)
    const self = this

    function open(cb) {
      self.opened = true
      self.archiver.on('ready', () => {
        self.emit('ready')
        cb()
      })
    }
  }

  createFeed(key, opts) {
    if (!this.opened) {
      throw new Error('multicore not ready, use .ready()')
    }
    return this.archiver.createFeed(key, opts)
  }

  replicate(opts) {
    if (!opts) {
      opts = {}
    }

    if (opts.discoveryKey) {
      opts.discoveryKey = toBuffer(opts.discoveryKey, 'hex')
    }

    if (opts.key) {
      opts.discoveryKey = hypercore.discoveryKey(toBuffer(opts.key, 'hex'))
    }

    const { archiver } = this

    const stream = protocol({
      live: true,
      id: archiver.changes.id,
      encrypt: opts.encrypt,
      extensions: ['hypermerge']
    })

    stream.on('feed', add)
    if (opts.channel || opts.discoveryKey) {
      add(opts.channel || opts.discoveryKey)
    }

    function add(dk) {
      archiver.ready((err) => {
        if (err) {
          stream.destroy(err)
          return
        }

        if (stream.destroyed) {
          return
        }

        const hex = dk.toString('hex')
        const changesHex = archiver.changes.discoveryKey.toString('hex')

        const archive = archiver.archives[hex]
        if (archive) {
          onarchive()
          return
        }

        const feed = changesHex === hex ? archiver.changes : archiver.feeds[hex]
        if (feed) {
          onfeed()
        }

        function onarchive() {
          archive.metadata.replicate({
            stream,
            live: true
          })
          archive.content.replicate({
            stream,
            live: true
          })
        }

        function onfeed() {
          if (stream.destroyed) {
            return
          }

          stream.on('close', onclose)
          stream.on('end', onclose)

          feed.on('_archive', onarchive)
          feed.replicate({
            stream,
            live: true
          })

          function onclose() {
            feed.removeListener('_archive', onarchive)
          }

          function onarchive() {
            if (stream.destroyed) {
              return
            }

            const { content } = archiver.archives[hex]
            content.replicate({
              stream,
              live: true
            })
          }
        }
      })
    }

    return stream
  }
}

module.exports = Multicore
