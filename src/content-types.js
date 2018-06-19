import Debug from 'debug'

const log = Debug('pushpin:content-types')

const registry = {}

// list() is called in Board's render; we need to return the same JS object each time
// to avoid expensive React re-renders of the nested BoardContextMenu component.
let listedCache = null

function register(contentType) {
  const { component, type, name, icon } = contentType
  const { context = 'default', unlisted = false, resizable = true } = contentType

  if (!component || !type || !name || !icon) {
    throw new Error('Missing something in register')
  }

  log('register', component.name, type, name, icon, context, unlisted, resizable)

  if (!registry[type]) {
    registry[type] = {}
  }
  registry[type][context] = contentType
  listedCache = null
}

function lookup({ type, context = 'default' } = {}) {
  if (!(type && registry[type])) {
    return null
  }
  if (registry[type][context]) {
    return registry[type][context]
  }
  return registry[type].default
}

function list({ withUnlisted = false } = {}) {
  if (withUnlisted) {
    return Object.values(registry).map(cts => cts.default)
  }
  if (!listedCache) {
    listedCache = Object.values(registry)
      .map(cts => cts.default || cts.board)
      .filter(ct => ct && !ct.unlisted)
  }
  return listedCache
}

export default { register, lookup, list }

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
