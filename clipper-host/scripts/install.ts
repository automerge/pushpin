#!/usr/bin/env node
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

type OS = 'windows' | 'mac' | 'unsupported'
const SRC_DIR = path.resolve(__dirname, '../src')
const DIST_DIR = path.resolve(__dirname, '../dist')

const osName = getOs()
const hostPath = getHostPath(osName)
const extensionId = process.argv[2]

if (!extensionId) throw new Error('Extension id required')

const template = fs.readFileSync(path.join(SRC_DIR, 'template.com.pushpin.pushpin.json'), {
  encoding: 'utf8',
})
const manifest = replace(template, { '{HOST_PATH}': hostPath, '{EXTENSION_ID}': extensionId })
fs.writeFileSync(path.join(DIST_DIR, 'com.pushpin.pushpin.json'), manifest)

// Register the manifest file with Chrome native hosts.
// TODO: errors
registerNativeHost(osName)

function getOs(): OS {
  if (os.type() === 'Darwin') return 'mac'
  if (os.type() === 'Windows_NT') return 'windows'
  throw new Error('Unsupported operating system')
}

function getHostPath(osName: OS) {
  if (osName === 'mac') return path.join(DIST_DIR, 'host.js')
  if (osName === 'windows') return 'host.bat'
  throw new Error('Unsupported Operating System')
}

function replace(template: string, values: { [find: string]: string }) {
  const search = new RegExp(Object.keys(values).join('|'), 'g')
  return template.replace(search, (matched) => {
    return values[matched]
  })
}

function registerNativeHost(osName: OS) {
  const registrationScript = getRegistrationScript(osName)
  exec(registrationScript, (err, stdout, stderr) => {
    if (err) {
      console.error(err)
      return
    }
    console.log(stdout)
  })
}

function getRegistrationScript(osName: OS) {
  if (osName === 'mac') return path.join(SRC_DIR, './register.sh')
  if (osName === 'windows') return path.join(SRC_DIR, './register.bat')
  throw new Error('Unsupported Operating System')
}