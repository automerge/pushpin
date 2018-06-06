import Debug from 'debug'

const log = Debug('pushpin:content-types')

const registry = []

function register({ component, type, name, icon, unlisted, resizable }) {
  if (!component || !type || !name || !icon) {
    throw new Error('Missing something in register')
  }
  log('register', component.name, type, name, icon, unlisted, resizable)

  const idx = registry.findIndex(item => item.type === type)

  if (idx >= 0) {
    delete registry.splice(idx, 1)
  }

  registry.push({
    component,
    type,
    name,
    icon,
    unlisted,
    resizable
  })
}

function list({ withUnlisted = false } = {}) {
  if (withUnlisted) {
    return registry
  }
  return registry.filter((t) => !t.unlisted)
}

export default { register, list }

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
