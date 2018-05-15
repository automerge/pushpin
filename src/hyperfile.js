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
//     HyperFile.write(client1Data, kayId, kayPath, (err, coreKey) => {
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
export function write(dataPath, imgId, imgPath, imgBuffer, callback) {
  const core = Hypercore(corePath(dataPath, imgId), hypercoreOptions)
  core.on('error', callback)
  core.on('ready', () => {
    Fs.readFile(imgPath, (error, image) => {
      if (error) {
        callback(error)
        return
      }

      core.append(image, (error) => {
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

export function writeBuffer(dataPath, imgId, buffer, callback) {
  const core = Hypercore(corePath(dataPath, imgId), hypercoreOptions)
  core.on('error', callback)
  core.on('ready', () => {
    core.append(buffer, (error) => {
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
export function fetch(dataPath, imgId, coreKey, callback) {
  const coreKeyBuf = Buffer.from(coreKey, 'base64')
  const core = Hypercore(corePath(dataPath, imgId), coreKeyBuf, hypercoreOptions)
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
