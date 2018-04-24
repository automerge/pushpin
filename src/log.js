const PATTERN = null // /editor\.(renderMark|decorateNode)/

function log(key, ...args) {
  if (PATTERN && PATTERN.test(key)) {
    console.log(key, ...args)
  }
}

export default log
