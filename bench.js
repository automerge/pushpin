const Automerge = require('automerge')
const Base58 = require('bs58')
const FS = require('fs')
const Hypercore = require('hypercore')
const toBuffer = require('to-buffer')

function parse(str) {
  const p = encodedParts(str)

  return {
    scheme: p.scheme,
    type: p.type,
    docId: p.docId && decode(p.docId),
    nonCrc: p.nonCrc,
    crc: p.crc && decode(p.crc),
  }
}

function encodedParts(str) {
  const [/* whole match */, nonCrc, scheme, type, docId, crc] = str.match(/^((\w+):\/\/(.+)\/(\w+))\/(\w{1,4})$/) || []
  return {
    nonCrc: nonCrc,
    scheme: scheme,
    type: type,
    docId: docId,
    crc: crc
  }
}

function decode(str) {
  return bufferToHex(Base58.decode(str))
}

function bufferToHex(key) {
  return Buffer.isBuffer(key) ? key.toString('hex') : key
}

if (process.argv.length !== 4) {
  console.error('Usage: node bench.js [user] [target-url]')
  process.exit(1)
}

if (!FS.existsSync('./bench')) {
  FS.mkdirSync('./bench')
}

const user = process.argv[2]
const targetUrl = process.argv[3]
const targetType = parse(targetUrl).type
const targetDocId = parse(targetUrl).docId

const indexBin = FS.readFileSync(`./data/${user}/hypermerge/changes/data`)
const indexStr = indexBin.toString()
const indexLines = indexStr.split('\n').slice(0, -1)
const indexActorIds = indexLines.map((l) => JSON.parse(l)['key'])
const indexDiscoveryKeys = indexActorIds.map((a) => Hypercore.discoveryKey(toBuffer(a, 'hex')).toString('hex'))

function openAllFeeds() {
  const docFeeds = {}
  let ready = 0

  const feedPromises = indexDiscoveryKeys.map((dk) => {
    const path = `./data/${user}/hypermerge/feeds/${dk.slice(0,2)}/${dk.slice(2,4)}/${dk.slice(4)}`
    const feed = new Hypercore(path, {valueEncoding: 'utf-8'})
    return new Promise((res, rej) => {
      feed.on('error', rej)
      feed.on('ready', () => {
        if (feed.length === 0) {
          return res()
        }
        feed.get(0, (err, dataStr) => {
          if (err) {
            return rej(err)
          }
          data = JSON.parse(dataStr)
          if (!docFeeds[data.docId]) {
            docFeeds[data.docId] = []
          }
          docFeeds[data.docId].push(feed)
          res()
        })
      })
    })
  })

  return Promise.all(feedPromises).then(() => {
    return Promise.resolve(docFeeds)
  })
}

function loadAndBuildDoc(docId, feeds) {
  const loadStart = Date.now()
  const loadPromises = []
  feeds.forEach((feed) => {
    for (let i=1; i<feed.length; i++) {
      const promise = new Promise((res, rej) => {
        feed.get(i, (err, dataStr) => {
          if (err) {
            return rej(err)
          }
          const data = JSON.parse(dataStr)
          res(data)
        })
      })
      loadPromises.push(promise)
    }
  })
  return Promise.all(loadPromises).then((changes) => {
    const loadTime = Date.now() - loadStart

    const prevSeqs = {}
    changes = changes.filter((change) => {
      if (!prevSeqs[change.actor]) {
        prevSeqs[change.actor] = 0
      }
      if (change.seq > prevSeqs[change.actor]) {
        prevSeqs[change.actor] = change.seq
        return true
      } else {
        console.log('skip', change.actor, change.seq)
        return false
      }
    })
    FS.writeFileSync(`./bench/${docId}.json`, JSON.stringify(changes))

    return Promise.resolve({changes, loadTime})
  })
}

const openFeedsStart = Date.now()
openAllFeeds().then((docFeeds) => {
  const openFeedsTime = Date.now() - openFeedsStart
  console.log(`openAllFeeds() took ${openFeedsTime} ms`)

  loadAndBuildDoc(targetDocId, docFeeds[targetDocId]).then((result) => {
    if (targetType === 'board') {
      let doc = Automerge.applyChanges(Automerge.init(), result.changes)
      const cardPromises = Object.values(doc.cards).forEach((card) => {
        const cardUrl = card.url
        const cardDocId = parse(cardUrl).docId
        if (!docFeeds[cardDocId]) {
          console.log('missing', cardUrl)
          return
        }
        loadAndBuildDoc(cardDocId, docFeeds[cardDocId]).then((result) => {
          console.log(cardUrl, result.loadTime)
        })
      })
    }
  })
})
