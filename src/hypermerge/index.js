const EventEmitter = require('events')
const Automerge = require('automerge')
const Multicore = require('./multicore')
const discoverySwarm = require('discovery-swarm')
const swarmDefaults = require('dat-swarm-defaults')
const Debug = require('debug')

const log = Debug('hypermerge:index')

// TODO: basic model
// actorId
// docId
// feedId
// groupId
// docId == actorId for writable

// The first block is used for metadata.
const START_BLOCK = 1
const METADATA = {
  hypermerge: 1
}

/**
 * An Automerge document.
 * @typedef {object} Document
 */

/**
 * Creates a new Hypermerge instance that manages a set of documents.
 * All previously opened documents are automatically re-opened.
 * @param {object} options
 * @param {object} options.storage - config compatible with Hypercore constructor storage param
 * @param {boolean} [options.immutableApi=false] - whether to use Immutable.js Automerge API
 * @param {number} [options.port=0] - port number to listen on
 * @param {object} [defaultMetadata={}] - default metadata that should be written for new docs
 */
class Hypermerge extends EventEmitter {
  constructor({ storage, port = 0, immutableApi = false, defaultMetadata = {} }) {
    super()

    this.immutableApi = immutableApi
    this.defaultMetadata = defaultMetadata
    this.port = port

    this.isReady = false
    this.feeds = {}
    this.pDocs = {} // index of docs previously emitted by `document:updated`
    this.docs = {}
    this.readyIndex = {} // docId -> Boolean
    this.groupIndex = {} // groupId -> [actorId]
    this.docIndex = {} // docId -> [actorId]
    this.metaIndex = {} // actorId -> metadata
    this.requestedBlocks = {} // docId -> actorId -> blockIndex (exclusive)

    this._onMulticoreReady = this._onMulticoreReady.bind(this)
    this.core = new Multicore(storage)
    this.core.on('ready', this._onMulticoreReady)
  }

  /**
   * Returns `true` if `docId` has been opened.
   */
  has(docId) {
    return !!this.docs[docId]
  }

  /**
   * Returns the document for the given docId.
   * Throws if the document has not been opened yet.
   */
  find(docId) {
    const doc = this.docs[docId]

    if (!doc) {
      throw new Error(`Cannot find document. open(docId) first. docId: ${docId}`)
    }

    return doc
  }

  set(doc) {
    const docId = this.getId(doc)
    log('set', docId)
    this.docs[docId] = doc
    return doc
  }

  /**
   * Opens an existing document.
   * Will download the document over the network if `hm.joinSwarm()` was called.
   * The document is opened asynchronously; listen for the `'document:ready'` event
   * to get the document when it has finished opening.
   *
   * @param {string} docId - docId of document to open
   */
  open(docId, metadata = null) {
    this._ensureReady()
    log('open', docId)

    if (this.docs[docId]) {
      return
    }

    // we haven't seen this doc before:
    this.feed(docId)
  }

  /**
   * Creates an automerge document backed by a new Hypercore.
   *
   * If metadata is passed, it will be associated with the newly created document.
   * Some metadata properties are assigned automatically by Hypermerge:
   *  - docId: An id for this document. Forking a document creates a new docId.
   *  - groupId: An id for this group of documents. Forking a document keeps the groupId.
   *
   * @param {object} metadata - metadata to be associated with this document
   */
  create(metadata = {}) {
    this._ensureReady()
    log('create')
    return this._create(metadata)
  }

  _create(metadata, parentMetadata = {}) {
    const feed = this.feed()
    const actorId = feed.key.toString('hex')
    log('_create', actorId)

    // Merge together the various sources of metadata, from lowest-priority to
    // highest priority.
    metadata = Object.assign(
      {},
      METADATA,
      { groupId: actorId }, // default to self if parent doesn't have groupId
      parentMetadata, // metadata of the parent feed to this feed (e.g. when opening, forking)
      this.defaultMetadata, // user-specified default metadata
      { docId: actorId }, // set the docId to this core's actorId by default
      metadata // directly provided metadata should override everything else
    )

    this._appendMetadata(actorId, metadata)

    const doc = this.set(this.empty(actorId))
    this._shareDoc(doc)

    return doc
  }

  /**
   * Shorthand for `hm.update(Automerge.change(doc, changeFn))`.
   */
  change(doc, message = null, changeFn) {
    const docId = this.getId(doc)
    log('change', docId)
    return this.update(Automerge.change(doc, message, changeFn))
  }

  /**
   * Finds any new changes for the submitted doc for the actor,
   * and appends the changes to the actor's hypercore feed.
   *
   * @param {Object} doc - document to find changes for
   */
  update(doc) {
    this._ensureReady()

    const actorId = this.getActorId(doc)
    const docId = this.actorToId(actorId)
    const pDoc = this.find(docId)
    log('update', docId, actorId)

    const changes = Automerge.getChanges(pDoc, doc)
      .filter(({ actor }) => actor === actorId)

    this._addToMaxRequested(docId, actorId, changes.length)

    this._appendAll(actorId, changes)

    this.pDocs[docId] = doc

    return this.set(doc)
  }

  /**
   * Creates a new actor hypercore feed and automerge document, with
   * an empty change that depends on the document for another actor.
   * The metadata of the new document will contain a `parentId` property.
   *
   * @param {string} parentId - id of document to fork
   */
  fork(parentId) {
    this._ensureReady()
    log('fork', parentId)

    const parent = this.find(parentId)
    const doc = this._create({ parentId }, this.metadata(parentId))

    return this.change(
      Automerge.merge(doc, parent),
      `Forked from ${parentId}`,
      () => {}
    )
  }

  /**
   * Takes all the changes from a document (sourceId) and adds them to
   * another document (destId). Returns the merged document.
   *
   * The source and destination docs must have come from the same root document.
   * e.g. The source doc was a `.fork()` of the destination doc, or visa-versa.
   *
   * @param {string} destId - docId to merge changes into
   * @param {string} sourceId - docId to copy changes from
   */
  merge(destId, sourceId) {
    this._ensureReady()
    log('merge', destId, sourceId)

    const dest = this.find(destId)
    const source = this.find(sourceId)

    return this.change(
      Automerge.merge(dest, source),
      `Merged with ${sourceId}`,
      () => {}
    )
  }

  /**
   * Removes hypercore feed for an actor and automerge doc.
   *
   * Leaves the network swarm. Doesn't remove files from disk.
   * @param {string} docId
   */
  delete(docId) {
    log('delete', docId)
    const doc = this.find(docId)
    this.core.archiver.remove(docId)
    delete this.feeds[docId]
    delete this.docs[docId]
    delete this.pDocs[docId]
    return doc
  }

  message(actorId, msg) {
    this.feed(actorId).peers.forEach(peer => {
      this._messagePeer(peer, msg)
    })
  }

  length(actorId) {
    return this._feed(actorId).length
  }

  /**
   * Returns true if the Hypercore corresponding to the given actorId is
   * writable. For each doc managed by hypermerge we should have one Hypercore
   * that we created and that's writable by us. The others will not be.
   *
   * @param {string} actorId - actor id
   * @returns {boolean}
   */
  isWritable(actorId) {
    return this._feed(actorId).writable
  }

  isOpened(actorId) {
    return this._feed(actorId).opened
  }

  empty(actorId) {
    return this.immutableApi
      ? Automerge.initImmutable(actorId)
      : Automerge.init(actorId)
  }

  /**
   * Returns the list of metadata objects corresponding to the list of actors
   * that have edited this document.
   */
  metadatas(docId) {
    const actorIds = this.docIndex[docId] || []
    return actorIds.map(actorId => this.metadata(actorId))
  }

  metadata(actorId) {
    return this.metaIndex[actorId]
  }

  isDocId(actorId) {
    return this.actorToId(actorId) === actorId
  }

  /**
   * Returns the `docId` for the given `doc`.
   */
  getId(doc) {
    return this.actorToId(this.getActorId(doc))
  }

  actorToId(actorId) {
    const { docId } = this.metadata(actorId)
    return docId
  }

  getActorId(doc) {
    return doc._actorId
  }

  getClock(doc) {
    return doc._state.getIn(['opSet', 'clock'])
  }

  _feed(actorId = null) {
    const key = actorId ? Buffer.from(actorId, 'hex') : null
    log('_feed', actorId)
    return this.core.createFeed(key)
  }

  feed(actorId = null) {
    this._ensureReady()

    if (actorId && this.feeds[actorId]) {
      return this.feeds[actorId]
    }

    log('feed.init', actorId)
    return this._trackFeed(this._feed(actorId))
  }

  isDocReady(docId) {
    return this.readyIndex[docId]
  }

  replicate(opts) {
    return this.core.replicate(opts)
  }

  /**
   * Joins the network swarm for all documents managed by this Hypermerge instance.
   * Must be called after `'ready'` has been emitted. `opts` are passed to discovery-swarm.
   */
  joinSwarm(opts = {}) {
    this._ensureReady()
    log('joinSwarm')

    this.swarm = discoverySwarm(swarmDefaults(Object.assign({
      port: this.port,
      hash: false,
      encrypt: true,
      stream: opts => this.replicate(opts)
    }, opts)))

    this.swarm.join(this.core.archiver.changes.discoveryKey)

    Object.values(this.feeds).forEach(feed => {
      this.swarm.join(feed.discoveryKey)
    })

    this.core.archiver.on('add', feed => {
      this.swarm.join(feed.discoveryKey)
    })

    this.core.archiver.on('remove', feed => {
      this.swarm.leave(feed.discoveryKey)
    })

    this.swarm.listen(this.port)

    this.swarm.once('error', err => {
      log('joinSwarm.error', err)
      this.swarm.listen()
    })

    return this
  }

  _appendMetadata(actorId, metadata) {
    if (this.length(actorId) > 0) {
      throw new Error('Metadata can only be set if feed is empty.')
    }

    this._setMetadata(actorId, metadata)

    return this._append(actorId, metadata)
  }

  _append(actorId, change) {
    log('_append', actorId)
    return this._appendAll(actorId, [change])
  }

  // Append all given `changes` to feed for `actorId`. Returns a promise that
  // resolves with no value on completion, or rejects with an error if one occurs.
  _appendAll(actorId, changes) {
    log('_appendAll', actorId)
    const blocks = changes.map(change => JSON.stringify(change))
    return new Promise((resolve, reject) => {
      this.feed(actorId).append(blocks, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  _trackFeed(feed) {
    const actorId = feed.key.toString('hex')
    log('_trackFeed', feed)

    this.feeds[actorId] = feed

    feed.ready(this._onFeedReady(actorId, feed))

    feed.on('peer-add', this._onPeerAdded(actorId))
    feed.on('peer-remove', this._onPeerRemoved(actorId))

    return feed
  }

  _onFeedReady(actorId, feed) {
    return () => {
      log('_onFeedReady', actorId)
      this._loadMetadata(actorId)
        .then(() => {
          const docId = this.actorToId(actorId)

          this._createDocIfMissing(docId, actorId)

          feed.on('download', this._onDownload(docId, actorId))

          return this._loadAllBlocks(actorId)
            .then(() => {
              if (actorId !== docId) {
                return
              }

              this.readyIndex[docId] = true
              this._emitReady(docId)
            })
        })

      /**
       * Emitted when a hypercore feed is ready.
       *
       * @event feed:ready
       * @param {object} feed - hypercore feed
       */
      this.emit('feed:ready', feed)
    }
  }

  _createDocIfMissing(docId, actorId) {
    if (this.docs[docId]) {
      return
    }

    if (this.isWritable(actorId)) {
      this.docs[docId] = this.empty(actorId)
    }

    const parentMetadata = this.metadata(actorId)

    this._create({ docId }, parentMetadata)
  }

  // Initialize in-memory data structures corresponding to the feeds we already
  // know about. Sets metadata for each feed, and creates and empty doc
  // corresponding to each Hypermerge doc. These docs will later be updated in
  // memory as we load changes from the corresponding Hypercores from disk and
  // network.
  _initFeeds(actorIds) {
    log('_initFeeds')
    const promises = actorIds.map((actorId) => {
      // Don't load metadata if the feed is empty.
      if (this.length(actorId) === 0) {
        log('_initFeeds.skipEmpty', actorId)
        return Promise.resolve(null)
      }

      return this._loadMetadata(actorId)
        .then(({ docId }) => {
          if (this.isWritable(actorId)) {
            this.docs[docId] = this.empty(actorId)
          }
          return actorId
        })
    })
    return Promise.all(promises)
  }

  _loadMetadata(actorId) {
    if (this.metaIndex[actorId]) {
      return Promise.resolve(this.metaIndex[actorId])
    }

    return new Promise((resolve, reject) => {
      this._feed(actorId).get(0, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
      .then(data => this._setMetadata(actorId, JSON.parse(data)))
  }

  _setMetadata(actorId, metadata) {
    if (this.metaIndex[actorId]) {
      return this.metaIndex[actorId]
    }

    this.metaIndex[actorId] = metadata
    const { docId, groupId } = metadata

    if (!this.groupIndex[groupId]) {
      this.groupIndex[groupId] = []
    }
    this.groupIndex[groupId].push(actorId)

    if (!this.docIndex[docId]) {
      this.docIndex[docId] = []
    }
    this.docIndex[docId].push(actorId)

    return metadata
  }

  _loadAllBlocks(actorId) {
    log('_loadAllBlocks', actorId)
    return this._loadOwnBlocks(actorId)
      .then(() => this._loadMissingBlocks(actorId))
  }

  _loadOwnBlocks(actorId) {
    const docId = this.actorToId(actorId)
    log('_loadOwnBlocks', docId, actorId)

    return this._loadBlocks(docId, actorId, this.length(actorId))
  }

  _loadMissingBlocks(actorId) {
    const docId = this.actorToId(actorId)
    log('_loadMissingBlocks', docId, actorId)

    if (docId !== actorId) {
      return Promise.resolve()
    }

    const deps = Automerge.getMissingDeps(this.find(docId))

    return Promise.all(Object.keys(deps).map((actor) => {
      const last = deps[actor] + 1 // last is exclusive
      return this._loadBlocks(docId, actor, last)
    }))
  }

  _loadBlocks(docId, actorId, last) {
    const first = this._maxRequested(docId, actorId, last)
    log('_loadBlocks', docId, actorId, first, last)

    // Stop requesting if done.
    if (first >= last) {
      return Promise.resolve()
    }

    return this._getBlockRange(actorId, first, last)
      .then(blocks => this._applyBlocks(docId, blocks))
      .then(() => this._loadMissingBlocks(docId))
  }

  _getBlockRange(actorId, first, last) {
    const length = Math.max(0, last - first)
    log('_getBlockRange', actorId, first, last)

    return Promise.all(Array(length).fill().map((_, i) =>
      this._getBlock(actorId, first + i)))
  }

  _getBlock(actorId, index) {
    log('_getBlock.start', actorId, index)
    return new Promise((resolve, reject) => {
      this.feed(actorId).get(index, (err, data) => {
        if (err) {
          reject(err)
        } else {
          log('_getBlock.resolve', actorId, index)
          resolve(data)
        }
      })
    })
  }

  _applyBlock(docId, block) {
    log('_applyBlock', docId)
    return this._applyBlocks(docId, [block])
  }

  _applyBlocks(docId, blocks) {
    log('_applyBlocks', docId)
    return this._applyChanges(docId, blocks.map(block => JSON.parse(block)))
  }

  _applyChanges(docId, changes) {
    log('_applyChanges', docId)
    return changes.length > 0
      ? this._setRemote(Automerge.applyChanges(this.find(docId), changes))
      : this.find(docId)
  }

  // Tracks which blocks have been requested for a given doc,
  // so we know not to request them again.
  _maxRequested(docId, actorId, max) {
    if (!this.requestedBlocks[docId]) {
      this.requestedBlocks[docId] = {}
    }

    const current = this.requestedBlocks[docId][actorId] || START_BLOCK
    this.requestedBlocks[docId][actorId] = Math.max(max, current)
    return current
  }

  _addToMaxRequested(docId, actorId, x) {
    if (!this.requestedBlocks[docId]) {
      this.requestedBlocks[docId] = {}
    }
    this.requestedBlocks[docId][actorId] = (this.requestedBlocks[docId][actorId] || START_BLOCK) + x
  }

  _setRemote(doc) {
    const docId = this.getId(doc)
    log('_setRemote', docId)

    this.set(doc)

    if (this.readyIndex[docId]) {
      const pDoc = this.pDocs[docId]

      this.pDocs[docId] = doc

      /**
       * Emitted when an updated document has been downloaded. Not emitted
       * after local calls to `.update()` or `.change()`.
       *
       * @event document:updated
       *
       * @param {string} docId - the hex id representing this document
       * @param {Document} document - automerge document
       * @param {Document} prevDocument - previous version of the document
       */
      this.emit('document:updated', docId, doc, pDoc)
    }
  }

  _shareDoc(doc) {
    const { groupId } = this.metadata(this.getActorId(doc))
    const keys = this.groupIndex[groupId]
    this.message(groupId, { type: 'FEEDS_SHARED', keys })
  }

  _relatedKeys(actorId) {
    const { groupId } = this.metadata(actorId)
    return this.groupIndex[groupId]
  }

  _messagePeer(peer, msg) {
    const data = Buffer.from(JSON.stringify(msg))
    peer.stream.extension('hypermerge', data)
  }

  _onMulticoreReady() {
    log('_onMulticoreReady')
    const actorIds =
      Object.values(this.core.archiver.feeds)
        .map(feed => feed.key.toString('hex'))

    this._initFeeds(actorIds)
      .then(() => {
        this.isReady = true
        actorIds.forEach(actorId => this.feed(actorId))

        /**
         * Emitted when all document metadata has been loaded from storage, and the
         * Hypermerge instance is ready for use. Documents will continue loading from
         * storage and the network. Required before `.create()`, `.open()`, etc. can be used.
         *
         * @event ready
         */
        this.emit('ready')
      })
  }

  _onDownload(docId, actorId) {
    return (index, data) => {
      log('_onDownload', docId, actorId, index)
      this._applyBlock(docId, data)
      this._loadMissingBlocks(docId)
    }
  }

  _onPeerAdded(actorId) {
    return (peer) => {
      peer.stream.on('extension', this._onExtension(actorId, peer))

      this._loadMetadata(actorId)
        .then(() => {
          if (!this.isDocId(actorId)) {
            return
          }

          const keys = this._relatedKeys(actorId)
          this._messagePeer(peer, { type: 'FEEDS_SHARED', keys })

          /**
           * Emitted when a network peer has connected.
           *
           * @event peer:left
           *
           * @param {string} actorId - the actorId of the connected peer
           * @param {object} peer - information about the connected peer
           */
          this.emit('peer:joined', actorId, peer)
        })
    }
  }

  _onPeerRemoved(actorId) {
    return peer => {
      this._loadMetadata(actorId)
        .then(() => {
          if (!this.isDocId(actorId)) {
            return
          }

          /**
           * Emitted when a network peer has disconnected.
           *
           * @event peer:left
           *
           * @param {string} actorId - the actorId of the disconnected peer
           * @param {object} peer - information about the disconnected peer
           */
          this.emit('peer:left', actorId, peer)
        })
    }
  }

  _onExtension(actorId, peer) {
    return (name, data) => {
      switch (name) {
        case 'hypermerge':
          this._onMessage(actorId, peer, data)
          break
        default:
          this.emit('peer:extension', actorId, name, data, peer)
      }
    }
  }

  _onMessage(actorId, peer, data) {
    const msg = JSON.parse(data)

    switch (msg.type) {
      case 'FEEDS_SHARED':
        msg.keys.forEach((actorId) => {
          this.feed(actorId)
        })
        break
      default:
        this.emit('peer:message', actorId, peer, msg)
    }
  }

  _emitReady(docId) {
    const doc = this.find(docId)
    log('_emitReady', docId)
    this.pDocs[docId] = doc

    /**
     * Emitted when a document has been fully loaded.
     *
     * @event document:ready
     *
     * @param {string} docId - the hex id representing this document
     * @param {Document} document - automerge document
     */
    this.emit('document:ready', docId, doc)
  }

  _ensureReady() {
    if (!this.isReady) {
      throw new Error('The Hypermerge instance is not ready yet. Use .on("ready") first.')
    }
  }
}

module.exports = Hypermerge
