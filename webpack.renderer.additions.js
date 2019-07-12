const path = require('path') //eslint-disable-line

/* the webpacked worker for PDFJS refers to "self" internally,
   which is not defined in a worker process because REASONS.
   this hack fixes the globalObject name in a way that doesn't have any (obvious)
   negative side-effects
   see: https://github.com/webpack/webpack/issues/6642 */
module.exports = {
  output: {
    globalObject: 'this',
  },
  stats: {
    assets: false,
    maxModules: 3,
  },
  resolve: {
    alias: {
      '@static': path.resolve(__dirname, 'static'), // Use in css like so: "~@static/asset.jpg"
    },
  },
}
