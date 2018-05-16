import Hypercore from 'hypercore'
import Hyperdiscovery from 'hyperdiscovery'
import Fs from 'fs'
import Path from 'path'

const hypercoreOptions = { valueEncoding: 'binary' }

function corePath(dataPath, imgId) {
  return Path.join(dataPath, imgId)
}

function serve(hypercore) {
  Hyperdiscovery(hypercore)
}

// Example:
//
//     const client1Data = '/Users/mmcgrana/Desktop/client-1'
//     const client2Data = '/Users/mmcgrana/Desktop/client-2'
//     const kayId = 'asset-1'
//     const kayPath = './img/kay.jpg'
//
//     HyperFile.writePath(client1Data, kayId, kayPath, (err, coreKey) => {
//       if (err) {
//         console.error(err)
//         process.exit(1)
//       }
//
//       HyperFile.serve(client1Data, kayId, coreKey, (err) => {
//         if (err) {
//           console.error(err)
//           process.exit(1)
//         }
//
//         HyperFile.fetch(client2Data, kayId, coreKey, (err) => {
//           if (err) {
//             console.error(err)
//             process.exit(1)
//           }
//
//           console.log(dataPath(client2Data, kayId))
//           process.exit(0)
//         })
//       })
//     })
//

// callback = (err, key)
export function writePath(dataPath, fileId, filePath, callback) {
  const core = Hypercore(corePath(dataPath, fileId), hypercoreOptions)
  core.on('error', callback)
  core.on('ready', () => {
    Fs.readFile(filePath, (error, buffer) => {
      if (error) {
        callback(error)
        return
      }

      core.append(buffer, (error) => {
        if (error) {
          callback(error)
          return
        }

        serve(core)
        callback(null, core.key)
      })
    })
  })
}

// callback = (err, key)
export function writeBuffer(dataPath, fileId, fileBuffer, callback) {
  const core = Hypercore(corePath(dataPath, fileId), hypercoreOptions)
  core.on('error', callback)
  core.on('ready', () => {
    core.append(fileBuffer, (error) => {
      if (error) {
        callback(error)
        return
      }

      serve(core)
      callback(null, core.key)
    })
  })
}

// callback = (err, blob)
export function fetch(dataPath, fileId, coreKey, callback) {
  const coreKeyBuf = Buffer.from(coreKey, 'base64')
  const core = Hypercore(corePath(dataPath, fileId), coreKeyBuf, hypercoreOptions)
  core.on('error', callback)
  core.on('ready', () => {
    serve(core)
    core.get(0, null, (error, data) => {
      if (error) {
        callback(error)
        return
      }

      callback(null, data)
    })
  })
}
