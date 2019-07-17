import path from 'path'
import fs from 'fs'
import Debug from 'debug'

import { DATA_PATH } from '../renderer/constants'

const log = Debug('DataMigration')

migrateUserData()

function migrateUserData() {
  // The node docs suggest that it's better to attempt fs operations and handle the error
  // than to check for the existance of the files. This will error if either
  // `../Electron` does not exist, or `DATA_PATH/pushpin-v10` already exists.
  try {
    const newPath = path.resolve(DATA_PATH, 'pushpin-v10')

    // Hyperfile currently uses DATA_PATH synchronously on import, so we use renameSync
    fs.renameSync(path.resolve(DATA_PATH, '../Electron/pushpin-v10'), newPath)

    log(`User data migrated to ${newPath}`)
  } catch (_err) {
    log('User data not migrated.')
  }
}
