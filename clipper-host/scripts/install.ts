#!/usr/bin/env node
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { DIST_DIR, SCRIPT_DIR } from './shared'

const CONFIG = {
  Darwin: {
    host: 'host.sh',
    registration: 'register.sh',
  },
  // Linux: {
  //   host: 'index.js',
  //   registration: 'registration.sh',
  // },
  Windows_NT: {
    host: 'host.bat',
    registration: 'register.bat ./clipper-host/dist/',
  },
}

const extensionId = process.argv[2] || 'kdnhjinccidgfopcfckekiihpjakjhng'

const config = CONFIG[os.type()]
if (!config) throw new Error('Unsupported operating system')

renderManifest()
registerNativeHost()

function renderManifest() {
  const template = fs.readFileSync(path.join(__dirname, 'template.com.pushpin.pushpin.json'), {
    encoding: 'utf8',
  })
  const manifest = replace(template, {
    '{HOST_PATH}': path.join(DIST_DIR, config.host).replace(/\\/g, '\\\\'),
    '{EXTENSION_ID}': extensionId,
  })
  fs.writeFileSync(path.join(DIST_DIR, 'com.pushpin.pushpin.json'), manifest)
}

function replace(template: string, values: { [find: string]: string }) {
  const search = new RegExp(Object.keys(values).join('|'), 'g')
  return template.replace(search, (matched) => {
    return values[matched]
  })
}

function registerNativeHost() {
  const script = path.join(SCRIPT_DIR, config.registration)
  exec(script, (err, stdout, stderr) => {
    if (err) {
      console.error(err)
      return
    }
    console.log(stdout)
  })
}
