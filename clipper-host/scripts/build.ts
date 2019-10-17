#!/usr/bin/env node
// import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

if (os.type() === 'Darwin' || os.type() === 'Linux') {
  fs.chmodSync(path.resolve(__dirname, '../dist/index.js'), 0o755)
}
