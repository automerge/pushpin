import Debug from 'debug'

const log = Debug('pushpin:content-types')

const registry = []

function register({ component, type, name, icon, initialize }) {
  if (!component || !type || !name || !icon) {
    throw new Error('Missing something in register')
  }
  log('register', component.name, type, name, icon)

  registry.push({
    component,
    type,
    name,
    icon,
    initialize
  })
}

function list() {
  return registry
}

export default { register, list }

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
