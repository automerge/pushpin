import Path from 'path'

export const IMAGE_DIALOG_OPTIONS = {
  properties: ['openFile'],
  filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
}

export const USER = process.env.NAME || 'userA'

export const USER_PATH = Path.join('.', 'data', USER)

export const WORKSPACE_ID_PATH = Path.join(USER_PATH, 'workspace-id.json')
export const HYPERMERGE_PATH = Path.join(USER_PATH, 'hypermerge')
export const HYPERFILE_DATA_PATH = Path.join(USER_PATH, 'hyperfile')
export const HYPERFILE_CACHE_PATH = Path.join(USER_PATH, 'hyperfile-cache')
