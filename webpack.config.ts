import * as path from 'path'
import webpack from 'webpack'
import { Configuration as DevServerConfig } from 'webpack-dev-server'
import HtmlPlugin from 'html-webpack-plugin'
import nodeExternals from 'webpack-node-externals'
import HardSourcePlugin from 'hard-source-webpack-plugin'
import ForkTsCheckerPlugin from 'fork-ts-checker-webpack-plugin'

interface Options {
  isDev: boolean
}

const cacheDirectory = undefined // path.resolve(__dirname, ".cache")

const tsRule: webpack.Rule = {
  test: /\.[tj]sx?$/,
  include: path.resolve(__dirname, 'src'),
  use: [
    {
      loader: 'ts-loader',
      options: {
        experimentalWatchApi: true,
        transpileOnly: true,
      },
    },
  ],
}

const cssRule: webpack.Rule = {
  test: /\.css$/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: false,
        // // TODO: use css modules
        // {
        //   mode: 'local',
        //   localIdentName: '[local]-[hash:base64:5]',
        // },
      },
    },
  ],
}

const imageRule: webpack.Rule = {
  test: /\.(png|svg|jpg|gif)$/,
  use: {
    loader: 'file-loader',
    options: {
      outputPath: 'assets',
      publicPath: 'assets',
      name: '[name].[ext]',
    },
  },
}

const fontRule: webpack.Rule = {
  test: /\.(woff|woff2|eot|ttf|otf)$/,
  use: {
    loader: 'file-loader',
    options: {
      outputPath: 'assets',
      publicPath: 'assets',
      name: '[name].[ext]',
    },
  },
}

const devServer: DevServerConfig = {
  contentBase: path.join(__dirname, 'dist'),
  hotOnly: true,
  overlay: {
    warnings: false,
    errors: true,
  },
}

function shared({ isDev }: Options): webpack.Configuration {
  return {
    context: path.resolve(__dirname),
    devtool: isDev ? undefined : 'source-map',
    devServer,
    stats: {
      assets: false,
      maxModules: 3,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    externals: [
      nodeExternals({
        whitelist: [/webpack/, '@ibm/plex', 'codemirror'],
      }),
    ],
    module: {
      rules: [tsRule, cssRule, imageRule, fontRule],
    },
  }
}

function config(cb: (opts: Options) => webpack.Configuration) {
  return (env: any, args: any) => {
    const { mode = 'development' } = args
    const opts = { isDev: mode === 'development' }
    const conf = cb(opts)

    return Object.assign(
      {},
      shared(opts),
      {
        mode,
        output: {
          path: path.resolve(__dirname, 'dist'),
          filename: `[name].js`,
          globalObject: 'this',
        },
      } as webpack.Configuration,
      conf
    )
  }
}

export default [
  config(({ isDev }) => ({
    name: 'main',
    entry: ['./src/main'],
    target: 'electron-main',
    plugins: [
      new ForkTsCheckerPlugin({
        formatter: 'codeframe',
      }),
      ...(isDev
        ? [
            new HardSourcePlugin({
              cacheDirectory,
              info: {
                level: 'warn',
                mode: 'none',
              },
            }),
          ]
        : []),
    ],
  })),

  config(({ isDev }) => ({
    name: 'renderer',
    entry: {
      renderer: './src/renderer',
      background: './src/background',
    },
    target: 'electron-renderer',
    plugins: [
      new ForkTsCheckerPlugin({
        formatter: 'codeframe',
      }),
      new HtmlPlugin({ title: 'PushPin', chunks: ['renderer'] }),
      new HtmlPlugin({
        title: 'PushPin: Background',
        chunks: ['background'],
        filename: 'background.html',
      }),
      ...(isDev
        ? [
            new HardSourcePlugin({
              cacheDirectory,
              info: {
                level: 'warn',
                mode: 'none',
              },
            }),
            new webpack.HotModuleReplacementPlugin(),
          ]
        : []),
    ],
  })),
]
