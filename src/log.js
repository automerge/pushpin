const PATTERN = null

function log(key, ...args) {
  if (PATTERN && PATTERN.test(key)) {
    console.log(key, ...args)
  }
}

export default log
