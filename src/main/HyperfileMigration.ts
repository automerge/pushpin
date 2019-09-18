import path from 'path'
import fs from 'fs'
import Debug from 'debug'

import { HYPERMERGE_PATH, HYPERFILE_PATH } from '../renderer/constants'

const log = Debug('HyperfileMigration')

// TODO: Remove this file if found after Oct 1st, 2019.
// Added on Sep 16th, 2019.
migrateHyperfileData()

function migrateHyperfileData() {
  // The node docs suggest that it's better to attempt fs operations and handle the error
  // than to check for the existance of the files. This will error if either
  // `../Electron` does not exist, or `DATA_PATH/pushpin-v10` already exists.
  try {
    const destinationDir = HYPERMERGE_PATH
    const sourceDir = HYPERFILE_PATH
    const migratedSourceDir = `${sourceDir}_premigration_ledger`
    fs.mkdirSync(migratedSourceDir)

    const filenames = fs.readdirSync(sourceDir)
    filenames.forEach((filename: string) => {
      const source = path.join(sourceDir, filename)
      let destination
      if (filename === 'ledger') {
        destination = path.join(migratedSourceDir, filename)
      } else {
        destination = path.join(destinationDir, filename)
      }
      fs.renameSync(source, destination)
    })

    fs.rmdirSync(sourceDir)
    log('Hyperfile data migrated')
  } catch (_err) {
    log(`Hyperfile data not migrated. Reason: \n${_err}`)
  }
}
