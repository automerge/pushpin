import path from 'path'
import fs from 'fs'
import Debug from 'debug'

import { HYPERMERGE_PATH, HYPERFILE_PATH } from '../renderer/constants'

const log = Debug('HyperfileMigration')

// TODO: Remove this file if found after Aug 1st, 2019.
// Added on Jul 17th, 2019.
migrateHyperfileData()

function migrateHyperfileData() {
  // The node docs suggest that it's better to attempt fs operations and handle the error
  // than to check for the existance of the files. This will error if either
  // `../Electron` does not exist, or `DATA_PATH/pushpin-v10` already exists.
  try {
    const destinationDir = path.resolve(HYPERMERGE_PATH)
    const sourceDir = path.resolve(HYPERFILE_PATH)

    const filenames = fs.readdirSync(sourceDir)
    filenames.forEach((filename: string) => {
      if (filename === 'ledger') return
      const source = path.resolve(sourceDir, filename)
      const destination = path.resolve(destinationDir, filename)
      fs.renameSync(source, destination)
    })

    const migratedSourceDir = `${sourceDir}_migrated`
    fs.renameSync(path.resolve(sourceDir), migratedSourceDir)
    log(`Hyperfile data migrated`)
  } catch (_err) {
    log('Hyperfile data not migrated.')
  }
}
