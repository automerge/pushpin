import Hypercore from 'hypercore';
import Hyperdiscovery from 'hyperdiscovery';
import Fs from 'fs';
import Path from 'path';

const hypercoreOptions = { valueEncoding: 'binary' };

function corePath(dataPath, imgId) {
  return Path.join(dataPath, imgId);
}

function serve(hypercore) {
  Hyperdiscovery(hypercore);
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
export function write(dataPath, imgId, imgPath, callback) {
  const core = Hypercore(corePath(dataPath, imgId), hypercoreOptions);
  core.on('error', callback);
  core.on('ready', () => {
    const readStream = Fs.createReadStream(imgPath);
    const writeStream = core.createWriteStream();

    readStream.on('error', callback);
    writeStream.on('error', callback);
    writeStream.on('finish', () => {
      serve(core);
      callback(null, core.key);
    });

    readStream.pipe(writeStream);
  });
}

// callback = (err, blobPath)
export function fetch(dataPath, imgId, coreKey, callback) {
  coreKey = Buffer.from(coreKey, 'base64');
  const core = Hypercore(corePath(dataPath, imgId), coreKey, hypercoreOptions);
  core.on('error', callback);
  core.on('ready', () => {
    serve(core);
    core.get(0, null, (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      const blobPath = Path.join(dataPath, imgId, 'data');
      callback(null, blobPath);
    });
  });
}
