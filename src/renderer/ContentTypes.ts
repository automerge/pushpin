import Debug from 'debug'
import { ComponentType } from 'react'
// import { ContentProps } from './components/Content';

const log = Debug('pushpin:content-types')

// type Component = ComponentType<ContentProps>
// TODO: This should be ComponentType<ContentProps>, but it breaks with
// Content's "pass-through" props when React casts them with Readonly<P>.
// The fix is likely to put "pass-through" props inside a single 'options: any' prop
// that allows for pass-through.
type Component = ComponentType<any>

export type Context =
  | 'root'
  | 'workspace'
  | 'list'
  | 'board'
  | 'thread'
  | 'title-bar'

type Contexts = {
  [K in Context]?: Component
}


interface ContentType {
  type: string
  name: string
  icon: string
  unlisted?: boolean
  resizable?: boolean
  contexts: Contexts
}

const registry: { [type: string]: ContentType } = {}
const defaultRegistry = {}


function register(contentType: ContentType) {
  const { type } = contentType
  const entry = { unlisted: false, resiable: true, ...contentType }

  log('register', entry)

  if (registry[type]) {
    throw new Error(`Type already registered: ${type}`)
  }

  registry[type] = entry
}

function registerDefault(contentType: { component: Component, context: Context }) {
  const { component, context } = contentType
  defaultRegistry[context] = component
}

interface LookupQuery {
  type: string
  context: string
}

interface LookupResult {
  type: string
  name: string
  icon: string
  unlisted: boolean
  resizable: boolean
  component: Component
}

function lookup({ type, context }: LookupQuery): LookupResult | null {
  const entry = registry[type]
  const component = entry
    && entry.contexts[context]
    || defaultRegistry[context]


  if (!component) {
    return null
  }

  const {
    name = 'Unknown',
    icon = 'question',
    unlisted = false,
    resizable = true
  } = entry || {}

  return { type, name, icon, component, unlisted, resizable }
}

interface ListQuery {
  context: Context
  withUnlisted?: boolean
}

function list({ context, withUnlisted = false }: ListQuery) {
  const allTypes = Object.keys(registry)
    .map(type => lookup({ type, context }))
    .filter(ct => !!ct)

  if (withUnlisted) {
    return allTypes
  }

  return allTypes.filter(ct => ct && !ct.unlisted)
}

export default { register, registerDefault, lookup, list }

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
