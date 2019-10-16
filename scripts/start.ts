import proc from 'child_process'
import path from 'path'
import webpack from 'webpack'
import DevServer from 'webpack-dev-server'
import electron from 'electron'
import configFns from '../webpack.config'

const configs = configFns.map((c) => c(null, { mode: 'development' }))

const mainConfig = configs.filter((c) => c.name === 'main')[0]
const renderConfig = configs.filter((c) => c.name === 'renderer')[0]
const devServerConfig = renderConfig.devServer

if (!devServerConfig) {
  throw new Error('No devServer config found in webpack.config')
}

const mainCompiler = webpack(mainConfig)
const renderCompiler = webpack(renderConfig)

const server = new DevServer(renderCompiler, devServerConfig)
server.listen(8080)

mainCompiler.run((err, stats) => {
  if (err) {
    console.log(err) // eslint-disable-line no-console
    process.exit(1)
    return
  }

  proc.spawn(electron as any, [path.resolve(__dirname, '..')], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })

  mainCompiler.watch({}, () => {})
})
