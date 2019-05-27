import Path from 'path'
import Url from 'url'
import electron from 'electron'

/* we need to resolve static assets differently in local HMR development mode */
const isDevelopment = process.env.NODE_ENV !== 'production'

function getStatic(val) {
  if ((typeof window !== 'undefined') && isDevelopment) {
    return Url.resolve(window.location.origin, val)
  }
  return Path.resolve(__static, val)
}

export const IMAGE_DIALOG_OPTIONS = {
  properties: ['openFile'],
  filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
}

// Prefer NAME if explicitly set.
// Otherwise look for OS-level USER (Mac / Linux) or USERNAME (Windows.)
export const USER = process.env.NAME
                    || process.env.USER
                    || process.env.USERNAME
if (!USER) {
  throw new Error('No user name found')
}

// We want these constants available from both the main and render threads.
const app = electron.app || electron.remote.app
export const USER_PATH = Path.join(app.getPath('userData'), 'pushpin-v10', USER)

export const WORKSPACE_URL_PATH = Path.join(USER_PATH, 'workspace-id.json')
export const HYPERMERGE_PATH = Path.join(USER_PATH, 'hypermerge')
export const HYPERFILE_PATH = Path.join(USER_PATH, 'hyperfile')
// eslint
export const DEFAULT_AVATAR_PATH = getStatic('default-avatar.png')
