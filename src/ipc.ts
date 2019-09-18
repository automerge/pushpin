import ipc from 'node-ipc'
import { USER } from './renderer/constants'

ipc.config.silent = true
ipc.config.appspace = `pushpin.${USER}.`
ipc.config.maxRetries = 2 as any
ipc.config.maxConnections = 1

export default ipc
