const Hypercore = require('hypercore')
const Hyperdiscovery = require('hyperdiscovery')
const Fs = require('fs')
const Path = require('path')
const toBuffer = require('to-buffer')

const hypercoreOptions = {valueEncoding: 'binary'}

const client1Data = '/Users/mmcgrana/Desktop/client-1'
const client2Data = '/Users/mmcgrana/Desktop/client-2'
const kayId = 'asset-1'
const kayPath = './img/kay.jpg'

function corePath(dataPath, imgId) {
  return Path.join(dataPath, imgId)
}

function dataPath(dataPath, imgId) {
  return Path.join(dataPath, imgId, 'data')
}

// callback = (err, key)
function write(dataPath, imgId, imgPath, callback) {
  const core = Hypercore(corePath(dataPath, imgId), hypercoreOptions)
  core.on('error', callback)
  core.on('ready', () => {
    readStream = Fs.createReadStream(imgPath)
    writeStream = core.createWriteStream()
    readStream.on('error', callback)
    writeStream.on('error', callback)
    writeStream.on('finish', () => {
      core.close()
      callback(null, core.key)
    })
    readStream.pipe(writeStream)
  })
}

// callback = (err)
function serve(dataPath, imgId, coreKey, callback) {
  const core = Hypercore(corePath(dataPath, imgId), coreKey, hypercoreOptions)
  core.on('error', callback)
  core.on('ready', () => {
    swarm = Hyperdiscovery(core)
    callback(null)
  })
}

// callback = (err)
function fetch(dataPath, imgId, coreKey, callback) {
  const core = Hypercore(corePath(dataPath, imgId), coreKey, hypercoreOptions)
  core.on('error', callback)
  core.on('ready', () => {
    swarm = Hyperdiscovery(core)
    core.download()
  })
  core.on('sync', () => {
    core.close()
    callback(null)
  })
}

write(client1Data, kayId, kayPath, (err, coreKey) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  serve(client1Data, kayId, coreKey, (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    fetch(client2Data, kayId, coreKey, (err) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }

      console.log(dataPath(client2Data, kayId))
      process.exit(0)
    })
  })
})

// function fetch(key) {
//
// }
//
// function serve(key) {
//
// }
//
// function localPath(imgId, dataPath) {
//
// }


// function runWriter(cb) {
//   console.log('writer.start')
//   const kayCoreWriter = Hypercore('./assets/kay-writer', {valueEncoding: 'binary'})
//   kayCoreWriter.on('error', function(err) {
//     console.log('writer.error', err)
//   })
//   kayCoreWriter.on('ready', function() {
//     console.log('writer.ready')
//     const kayCoreWriteStream = kayCoreWriter.createWriteStream()
//     const kayFileReadStream = Fs.createReadStream('./img/kay.jpg')
//     kayFileReadStream.pipe(kayCoreWriteStream)
//     kayCoreWriteStream.on('finish', function() {
//       console.log('writer.piped', kayCoreWriter.byteLength)
//       kaySwarmWriter = Hyperdiscovery(kayCoreWriter)
//       kaySwarmWriter.on('connection', function(peer, type) {
//         console.log('writer.join')
//         peer.on('close', function() {
//           console.log('writer.leave')
//         })
//       })
//       cb(kayCoreWriter.key)
//     })
//   })
// }
//
// function runReader(key) {
//   console.log('reader.start', key.toString('hex'))
//   const kayCoreReader = Hypercore('./assets/kay-reader', key, {valueEncoding: 'binary'})
//   kayCoreReader.on('error', function(err) {
//     console.log('reader.error', err)
//   })
//   kayCoreReader.on('download', function() {
//     console.log('reader.download')
//   })
//   kayCoreReader.on('sync', function() {
//     console.log('reader.sync')
//     process.exit(0)
//   })
//   kayCoreReader.on('ready', function() {
//     console.log('reader.ready')
//     kayCoreReader.download()
//   })
//   kaySwarmReader = Hyperdiscovery(kayCoreReader)
//   kaySwarmReader.on('connection', function(peer, type) {
//     console.log('reader.join')
//     peer.on('close', function() {
//       console.log('reader.leave')
//     })
//   })
// }
//
// runWriter(runReader)
