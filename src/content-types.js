import Debug from 'debug'

const log = Debug('pushpin:content-types')

const registry = []
const registryListed = []

function register(contentType) {
  const { component, type, name, icon, unlisted, resizable } = contentType

  if (!component || !type || !name || !icon) {
    throw new Error('Missing something in register')
  }
  log('register', component.name, type, name, icon, unlisted, resizable)

  registry.push(contentType)
  if (!unlisted) {
    registryListed.push(contentType)
  }
}

function list({ withUnlisted = false } = {}) {
  if (withUnlisted) {
    return registry
  }
  return registryListed
}

export default { register, list }

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
