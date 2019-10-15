import proc from 'child_process'
import path from 'path'
import webpack from 'webpack'
import DevServer from 'webpack-dev-server'
import electron from 'electron'
import configFns from '../webpack.config'

const configs = configFns.map((c) => c(null, { mode: 'development' }))

/** These configs will be run before electron is started. */
const initialConfigs = configs.filter((c) => ['main', 'freeze-dry-preload'].includes(c.name!))

/** This config is run by the webpack-dev-server. */
const renderConfig = configs.filter((c) => c.name === 'renderer')[0]
const devServerConfig = renderConfig.devServer

if (!devServerConfig) {
  throw new Error('No devServer config found in webpack.config')
}

const initialCompiler = webpack(initialConfigs)
const renderCompiler = webpack(renderConfig)

const server = new DevServer(renderCompiler, devServerConfig)
server.listen(8080)

initialCompiler.run((err, stats) => {
  if (err) {
    console.log(err) // eslint-disable-line no-console
    process.exit(1)
    return
  }

  proc
    .spawn(electron as any, [path.resolve(__dirname, '..')], {
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    .on('close', (code) => {
      process.exit(code)
    })
})
