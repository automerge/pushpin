import path from 'path'
import { app } from 'electron'
import os from 'os'
import fs from 'fs'
import Registry from 'winreg'

type OsType = 'mac' | 'windows' | 'linux' | 'unsupported'
const EXTENSION_ID = 'kdnhjinccidgfopcfckekiihpjakjhng'
const HOST_NAME = 'com.pushpin.pushpin'
const MANIFEST_FILE = `${HOST_NAME}.json`

export function install() {
  const isDev = getIsDev()
  const osType = getOsType()
  const manifest = getManifest({
    hostPath: getClipperHostPath(osType, isDev),
    extensionId: EXTENSION_ID,
  })
  writeManifest(osType, manifest)
}

function getIsDev() {
  return process.env.NODE_ENV !== 'production'
}

// Note: Should this use os.platform() instead?
function getOsType() {
  switch (os.type()) {
    case 'Darwin':
      return 'mac'
    case 'Windows_NT':
      return 'windows'
    case 'Linux':
      return 'linux'
    default:
      return 'unsupported'
  }
}

function getClipperHostPath(osType: OsType, isDev: boolean) {
  const scriptName = osType === 'windows' ? 'clipper-host.bat' : 'clipper-host.sh'
  if (isDev) return path.resolve(app.getAppPath(), 'dist/clipper-host', scriptName)
  return path.resolve(path.dirname(app.getPath('exe')), scriptName)
}

function getManifest({ hostPath, extensionId }) {
  return {
    name: 'com.pushpin.pushpin',
    description: 'PushPin',
    path: hostPath,
    type: 'stdio',
    allowed_origins: [`chrome-extension://${extensionId}/`],
  }
}

function writeManifest(osType: OsType, manifest) {
  switch (osType) {
    case 'mac': {
      // TODO: deal with root user and system-wide installation
      const nativeHostManifestPath = path.resolve(
        os.homedir(),
        'Library/Application Support/Google/Chrome/NativeMessagingHosts',
        MANIFEST_FILE
      )
      ensureDirectoryExists(path.dirname(nativeHostManifestPath))
      fs.writeFileSync(nativeHostManifestPath, JSON.stringify(manifest))
      break
    }
    case 'linux': {
      console.error('unsupported')
      break
    }
    case 'windows': {
      const nativeHostManifestPath = path.resolve(
        app.getPath('userData'),
        'clipper-host',
        MANIFEST_FILE
      )
      ensureDirectoryExists(path.dirname(nativeHostManifestPath))
      fs.writeFileSync(nativeHostManifestPath, JSON.stringify(manifest))
      // childProcess.execSync(
      //   `reg add HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\com.pushpin.pushpin /f /ve /t REG_SZ /d ${nativeHostManifestPath}`
      // )
      const registry = new Registry({
        hive: Registry.HKCU,
        key: '\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.pushpin.pushpin',
      })
      registry.set(Registry.DEFAULT_VALUE, Registry.REG_SZ, nativeHostManifestPath, (err) => {
        if (err) {
          throw new Error(`registry failed: ${err}`)
        }
      })
      break
    }
    default: {
      console.error('unsupported')
      break
    }
  }
}

function ensureDirectoryExists(path: string) {
  try {
    fs.mkdirSync(path, { recursive: true })
  } catch (e) {
    // On slightly older versions of node, this will throw if the directory already exists
  }
}
