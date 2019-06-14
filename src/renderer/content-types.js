import Debug from 'debug'

const log = Debug('pushpin:content-types')

const registry = {}

// list() is called in Board's render; we need to return the same JS object each time
// to avoid expensive React re-renders of the nested BoardContextMenu component.
let listedCache = null

function register(contentType) {
  const { component, type, name, icon } = contentType
  const { unlisted = false, resizable = true } = contentType
  let { context } = contentType

  if (!component || !type || !name || !icon) {
    throw new Error('Register requires a component, a type, a name, and an icon.')
  }

  if (!context) {
    throw new Error('Register requires a context... for now.')
  }

  log('register', component.name, type, name, icon, context, unlisted, resizable)

  if (!Array.isArray(context)) {
    context = [context]
  }

  context.forEach((cxt) => {
    if (!registry[cxt]) {
      registry[cxt] = {}
    }
    registry[cxt][type] = contentType
  })

  listedCache = null
}

function lookup({ type, context = 'workspace' } = {}) {
  if (!(type && registry[context])) {
    return null
  }
  if (registry[context][type]) {
    return registry[context][type]
  }
  return registry[context].default
}

function list({ withUnlisted = false } = {}) {
  if (withUnlisted) {
    return Object.values(registry.board)
  }
  if (!listedCache) {
    listedCache = Object.values(registry.board)
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
