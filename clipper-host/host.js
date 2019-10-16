#!/usr/bin/env node

//const ipc = require('node-ipc')
var sendMessage = require('native-messaging')(handleMessage)

// shamelessly lifted from pushpin core
// const USER = process.env.NAME || process.env.USER || process.env.USERNAME
// ipc.config.silent = true
// ipc.config.appspace = `pushpin.${USER}.`
// ipc.config.maxRetries = 2
// ipc.config.maxConnections = 1
// ipc.config.id = 'clipper'

// // pvh's extension ID is: fcanljfkfdhddpeikfmdojfclefaeioj
// console.error('appspace: ' + ipc.config.appspace)

function handleMessage(req) {
  sendMessage({ message: 'forwarding to pushpin' })
  // ipc.connectTo('renderer', () => {
  //   sendMessage({ message: 'connected to pushpin' })
  //   ipc.of.renderer.on('connect', function() {
  //     ipc.of.renderer.emit('message', req)
  //     ipc.disconnect('renderer')
  //     sendMessage({ message: 'forwarded to pushpin' })
  //   })
  // })
}
