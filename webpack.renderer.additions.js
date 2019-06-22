/* the webpacked worker for PDFJS refers to "self" internally,
   which is not defined in a worker process because REASONS.
   this hack fixes the globalObject name in a way that doesn't have any (obvious)
   negative side-effects
   see: https://github.com/webpack/webpack/issues/6642 */
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  output: {
    globalObject: 'this',
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  entry: {
    renderer: './src/renderer/index.js',
    background: './src/background/index.js'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minChunks: 2
    },
  },
  plugins: [

    new HtmlWebpackPlugin({
      template: '!!html-loader?minimize=false&url=false!dist/.renderer-index-template.html',
      excludeChunks: ['background'],
      filename: 'foreground.html'
    }),
    new HtmlWebpackPlugin({
      template: '!!html-loader?minimize=false&url=false!dist/.renderer-index-template.html',
      excludeChunks: ['renderer'],
      filename: 'background.html'
    })
  ]
}
