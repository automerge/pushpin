import Debug from 'debug'

const log = Debug('pushpin:content-types')

const registry = {}
const registryListed = {}

function register(contentType) {
  const { component, type, context = 'default', name, icon, unlisted, resizable } = contentType

  if (!component || !type || !name || !icon) {
    throw new Error('Missing something in register')
  }

  log('register', component.name, type, name, icon, unlisted, resizable)

  if (!registry[type]) {
    registry[type] = {}
  }

  registry[type][context] = contentType
  if (!unlisted) {
    if (!registryListed[type]) {
      registryListed[type] = {}
    }
    registryListed[type][context] = contentType
  }
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
    return Object.values(registry).map(e => e.default)
  }
  return Object.values(registryListed).map(e => e.default)
}

export default { register, lookup, list }

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
