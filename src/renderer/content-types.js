import Debug from 'debug'

const log = Debug('pushpin:content-types')

const registry = {}
const defaultRegistry = {}

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

  const { name = 'Unknown', icon = 'question', unlisted, resizable } = entry || {}

  return { type, name, icon, component, unlisted, resizable }
}

function list({ context, withUnlisted = false } = {}) {
  const allTypes = Object.keys(registry)
    .map(type => lookup({ type, context }))
    .filter(ct => !!ct)

  if (withUnlisted) {
    return allTypes
  }

  return allTypes.filter(type => !type.unlisted)
}

export default { register, registerDefault, lookup, list }

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
