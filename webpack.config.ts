import * as path from 'path'
import webpack from 'webpack'
import HtmlPlugin from 'html-webpack-plugin'
import nodeExternals from 'webpack-node-externals'
import HardSourcePlugin from 'hard-source-webpack-plugin'
import ForkTsCheckerPlugin from 'fork-ts-checker-webpack-plugin'

const cacheDirectory = undefined // path.resolve(__dirname, ".cache")

const tsRule: webpack.Rule = {
  test: /\.[tj]sx?$/,
  use: [
    {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  ],
  exclude: [/node_modules/],
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

const shared: webpack.Configuration = {
  mode: 'development',
  context: path.resolve(__dirname),
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    hotOnly: true,
  },
  stats: {
    assets: false,
    maxModules: 3,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      static: path.resolve(__dirname, 'static'),
      // 'react-dom': '@hot-loader/react-dom',
    },
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

function config(opts: webpack.Configuration) {
  return Object.assign(
    {},
    shared,
    {
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `${opts.name}.js`,
        globalObject: 'this',
      },
    } as webpack.Configuration,
    opts
  )
}

export default [
  config({
    name: 'main',
    entry: ['./src/main'],
    target: 'electron-main',
    plugins: [
      new ForkTsCheckerPlugin({
        formatter: 'codeframe',
      }),
      new HardSourcePlugin({
        cacheDirectory,
        info: {
          level: 'warn',
          mode: 'none',
        },
      }),
    ],
  }),

  config({
    name: 'renderer',
    entry: ['./src/renderer'],
    target: 'electron-renderer',
    plugins: [
      new ForkTsCheckerPlugin({
        formatter: 'codeframe',
      }),
      new HtmlPlugin({ title: 'PushPin' }),
      new HardSourcePlugin({
        cacheDirectory,
        info: {
          level: 'warn',
          mode: 'none',
        },
      }),
      new webpack.HotModuleReplacementPlugin(),
    ],
  }),
]
