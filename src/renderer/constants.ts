import Path from 'path'
import electron from 'electron'
import DEFAULT_AVATAR_PATH from './images/default-avatar.png'

export { DEFAULT_AVATAR_PATH }

// Prefer NAME if explicitly set.
// Otherwise look for OS-level USER (Mac / Linux) or USERNAME (Windows.)
export const USER = process.env.NAME || process.env.USER || process.env.USERNAME

if (!USER) {
  throw new Error('No user name found')
}

// We want these constants available from both the main and render threads.
const app = electron.app || electron.remote.app
export const DATA_PATH = app.getPath('userData')
export const USER_PATH = Path.join(DATA_PATH, 'pushpin-v11', USER)
export const APP_PATH = app.getAppPath()

export const WORKSPACE_URL_PATH = Path.join(USER_PATH, 'workspace-id.json')
export const DEVICE_URL_PATH = Path.join(USER_PATH, 'device-id.json')
export const HYPERMERGE_PATH = Path.join(USER_PATH, 'hypermerge')
export const HYPERFILE_PATH = Path.join(USER_PATH, 'hyperfile')

export const FILE_SERVER_PATH = `/tmp/pushpin-${USER}.files`

// this next one should maybe just be URL list
export const PUSHPIN_DRAG_TYPE = 'application/pushpin-url'
export const BOARD_CARD_DRAG_ORIGIN = 'application/x-pushpin-board-source'
