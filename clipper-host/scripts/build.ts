#!/usr/bin/env node
import fs from 'fs'
import os from 'os'
import path from 'path'
import { SRC_DIR, DIST_DIR } from './shared'

// Copy windows bat file to host
fs.copyFileSync(path.join(SRC_DIR, 'host.bat'), path.join(DIST_DIR, 'host.bat'))
fs.copyFileSync(path.join(SRC_DIR, 'host.sh'), path.join(DIST_DIR, 'host.sh'))

// Make the host js file executable on mac/linux
if (os.type() === 'Darwin' || os.type() === 'Linux') {
  fs.chmodSync(path.join(DIST_DIR, 'index.js'), 0o755)
  fs.chmodSync(path.join(DIST_DIR, 'host.sh'), 0o755)
}
