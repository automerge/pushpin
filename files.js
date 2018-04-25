// This example is trying to load up an image file - stored locally
// in ./img/kay.jpg - into a Hypercore (runWriter), and then have another
// Hypercore connect to the first Hypercore and download all the image
// data (runReader). Discovery is handled by Hyperdiscovery.

const Hypercore = require('hypercore')
const Hyperdiscovery = require('hyperdiscovery')
const Fs = require('fs')
const toBuffer = require('to-buffer')

function runWriter(cb) {
  console.log('writer.start')
  const kayCoreWriter = Hypercore('./assets/kay-writer', {valueEncoding: 'binary'})
  kayCoreWriter.on('error', function(err) {
    console.log('writer.error', err)
  })
  kayCoreWriter.on('ready', function() {
    console.log('writer.ready')
    const kayCoreWriteStream = kayCoreWriter.createWriteStream()
    const kayFileReadStream = Fs.createReadStream('./img/kay.jpg')
    kayFileReadStream.pipe(kayCoreWriteStream)
    kayCoreWriteStream.on('finish', function() {
      console.log('writer.piped', kayCoreWriter.byteLength)
      kaySwarmWriter = Hyperdiscovery(kayCoreWriter)
      kaySwarmWriter.on('connection', function(peer, type) {
        console.log('writer.join')
        peer.on('close', function() {
          console.log('writer.leave')
        })
      })
      cb(kayCoreWriter.key)
    })
  })
}

function runReader(key) {
  console.log('reader.start', key.toString('hex'))
  const kayCoreReader = Hypercore('./assets/kay-reader', key, {valueEncoding: 'binary'})
  kayCoreReader.on('error', function(err) {
    console.log('reader.error', err)
  })
  kayCoreReader.on('download', function() {
    console.log('reader.download')
  })
  kayCoreReader.on('sync', function() {
    console.log('reader.sync')
    process.exit(0)
  })
  kayCoreReader.on('ready', function() {
    console.log('reader.ready')
    kayCoreReader.download()
  })
  kaySwarmReader = Hyperdiscovery(kayCoreReader)
  kaySwarmReader.on('connection', function(peer, type) {
    console.log('reader.join')
    peer.on('close', function() {
      console.log('reader.leave')
    })
  })
}

runWriter(runReader)
