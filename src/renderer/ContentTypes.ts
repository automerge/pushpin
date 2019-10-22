import Debug from 'debug'
import { ComponentType } from 'react'
import { Handle } from 'hypermerge'
import { HypermergeUrl, createDocumentLink, PushpinUrl } from './ShareLink'
import { ContentData } from './ContentData'

const log = Debug('pushpin:content-types')

// type Component = ComponentType<ContentProps>
// TODO: This should be ComponentType<ContentProps>, but it breaks with
// Content's "pass-through" props when React casts them with Readonly<P>.
// The fix is likely to put "pass-through" props inside a single 'options: any' prop
// that allows for pass-through.
type Component = ComponentType<any>

export type Context = 'root' | 'workspace' | 'list' | 'board' | 'thread' | 'title-bar' | 'contact'

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
  create?: (typeAttrs: any, handle: Handle<any>, callback: () => void) => void
  createFrom?: (contentData: ContentData, handle: Handle<any>, callback: () => void) => void
  supportsMimeType?: (type: string) => boolean
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

function mimeTypeToContentType(mimeType: string | null): string {
  if (!mimeType) {
    return 'file'
  } // don't guess.

  const types = Object.values(registry)
  const supportingType = types.find(
    (type) => type.supportsMimeType && type.supportsMimeType(mimeType)
  )
  if (!supportingType) {
    return 'file'
  }

  return supportingType.type
}

export type CreateCallback = (url: PushpinUrl) => void

export function createFrom(contentData: ContentData, callback: CreateCallback): void {
  // importFromText
  // TODO: the different content types should include mime type tests.
  let contentType
  if (contentData.mimeType === 'text/html') {
    contentType = 'url'
  } else if (contentData.mimeType.includes('text/')) {
    contentType = 'text'
  } else {
    contentType = 'file'
  }
  const entry = registry[contentType]
  if (!entry) return
  if (!entry.createFrom) throw new Error('Cannot be created from file')
  const url = window.repo.create() as HypermergeUrl
  const handle = window.repo.open(url)
  entry.createFrom(contentData, handle, () => {
    callback(createDocumentLink(contentType, url))
  })
}

export function create(type, attrs = {}, callback: CreateCallback): void {
  const entry = registry[type]
  if (!entry) {
    return
  }

  const url = window.repo.create() as HypermergeUrl
  const handle = window.repo.open(url)

  if (!entry.create) {
    throw Error(`The ${type} content type cannot be created directly.`)
  }
  entry.create(attrs, handle, () => {
    callback(createDocumentLink(type, url))
  })
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

export default {
  register,
  registerDefault,
  lookup,
  list,
  create,
  createFrom,
  mimeTypeToContentType, // move this too?
}

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
