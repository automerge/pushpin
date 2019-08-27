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

export type Context = 'root' | 'workspace' | 'list' | 'board' | 'thread' | 'title-bar'

type Contexts = {
  [K in Context]?: Component
}

interface ContentType {
  type: string
  name: string
  icon: string
  initializeDocument: (document: any, typeAttrs: any) => void
  unlisted?: boolean
  resizable?: boolean
  contexts: Contexts
  initializeContent: (typeAttrs: any, callback: (contentUrl: string) => void) => void
}

const registry: { [type: string]: ContentType } = {}
const defaultRegistry: {
  [K in Context]?: Component
} = {}

function register(contentType: ContentType) {
  const { type } = contentType
  const entry = { unlisted: false, resiable: true, ...contentType }

  log('register', entry)

  if (registry[type]) {
    // Allow re-registration to support HMR
    log(`Replacing '${type}' content type.`)
  }

  registry[type] = entry
}

function registerDefault(contentType: { component: Component; context: Context }) {
  const { component, context } = contentType
  defaultRegistry[context] = component
}

export interface LookupQuery {
  type: string
  context: Context
}

export interface LookupResult {
  type: string
  name: string
  icon: string
  unlisted: boolean
  resizable: boolean
  component: Component
}

function lookup({ type, context }: LookupQuery): LookupResult | null {
  const entry = registry[type]
  const component = (entry && entry.contexts[context]) || defaultRegistry[context]

  if (!component) {
    return null
  }

  const { name = 'Unknown', icon = 'question', unlisted = false, resizable = true } = entry || {}

  return { type, name, icon, component, unlisted, resizable }
}

function createFromFile(type, file, callback): void {
  // XXX -> use mimetypes here
  const entry = registry[type]
  if (!entry) {
    return
  }

  entry.initializeContent({ file }, callback)
}

function createFromAttrs(type, attrs, callback): void {
  // XXX -> use mimetypes here
  const entry = registry[type]
  if (!entry) {
    return
  }

  entry.initializeContent(attrs, callback)
}

function createNoAttrs(type, callback): void {
  // XXX -> use mimetypes here
  const entry = registry[type]
  if (!entry) {
    return
  }

  entry.initializeContent({}, callback)
}
export interface ListQuery {
  context: Context
  withUnlisted?: boolean
}

function list({ context, withUnlisted = false }: ListQuery): LookupResult[] {
  const allTypes = Object.keys(registry)
    .map((type) => lookup({ type, context }))
    .filter((ct) => ct) as LookupResult[]

  if (withUnlisted) {
    return allTypes
  }

  return allTypes.filter((ct) => ct && !ct.unlisted)
}

function initializeDocument(type: string, doc: any, typeAttrs: any) {
  const entry = registry[type]
  if (!entry) {
    throw new Error('Attempted to initialize an unregistered type!')
  }
  entry.initializeDocument(doc, typeAttrs)
}

export default {
  register,
  registerDefault,
  lookup,
  list,
  initializeDocument,
  createFromFile,
  createFromAttrs,
  createNoAttrs,
}

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
