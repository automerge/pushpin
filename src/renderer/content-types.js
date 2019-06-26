import Debug from 'debug'

const log = Debug('pushpin:content-types')

const registry = {}
const defaultRegistry = {}

// list() is called in Board's render; we need to return the same JS object each time
// to avoid expensive React re-renders of the nested BoardContextMenu component.
// TODO: this should not be a concern of content-types.js
let listedCache = null

function register(contentType) {
  const { type, name, icon } = contentType
  const { unlisted = false, resizable = true } = contentType
  const { contexts } = contentType

  if (!type || !name || !icon) {
    throw new Error('Register a type, a name, and an icon.')
  }

  if (!contexts) {
    throw new Error('Register requires a context... for now.')
  }

  log('register', type, name, icon, unlisted, resizable)

  if (!registry[type]) {
    registry[type] = { type, name, icon, unlisted, resizable }
  }

  registry[type].contexts = { ...registry[type].contexts, ...contexts }

  listedCache = null
}

function registerDefault(contentType) {
  const { component, context } = contentType
  defaultRegistry[context] = component
}

function lookup({ type, context } = {}) {
  const entry = registry[type]
  const component = entry
    && entry.contexts[context]
    || defaultRegistry[context]


  if (!component) {
    return null
  }

  const { name = 'Unknown', icon = 'question' } = entry || {}

  return { type, name, icon, component }
}

function list({ context, withUnlisted = false } = {}) {
  const allTypes = Object.keys(registry).map(type => lookup({ type, context })).filter(ct => !!ct)
  if (withUnlisted) {
    return allTypes
  }

  if (!listedCache) {
    listedCache = allTypes.filter(contentType => !contentType.unlisted)
  }
  return listedCache
}

export default { register, registerDefault, lookup, list }

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
