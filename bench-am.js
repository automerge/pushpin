const Automerge = require('automerge')
const Base58 = require('bs58')
const FS = require('fs')

if (process.argv.length !== 3) {
  console.error('Usage: node bench-am.js [bench/doc-id.json]')
  process.exit(1)
}

let loadStart = Date.now()
let changes = JSON.parse(FS.readFileSync(process.argv[2]))
let loadTime = Date.now() - loadStart

let buildStart = Date.now()
let board = Automerge.applyChanges(Automerge.init(), changes)
let buildTime = Date.now() - buildStart

loadStart = Date.now()
const cardChanges = {}
for (const card of Object.values(board.cards || {})) {
  const [_, docId58] = card.url.match(/^pushpin:\/\/[^\/]+\/(\w+)/) || []
  const cardUrl = card.url
  const cardDocId = Base58.decode(docId58).toString('hex')
  const filename = `./bench/${cardDocId}.json`

  if (!FS.existsSync(filename)) {
    console.log('missing', filename)
  } else {
    cardChanges[cardDocId] = JSON.parse(FS.readFileSync(filename))
  }
}

loadTime = loadTime + Date.now() - loadStart
console.log(`loading took ${loadTime} ms`)

buildStart = Date.now()
const cards = {}
for (const cardId of Object.keys(cardChanges)) {
  cards[cardId] = Automerge.applyChanges(Automerge.init(), cardChanges[cardId])
}
buildTime = buildTime + Date.now() - buildStart
console.log(`building took ${buildTime} ms`)
