import Debug from 'debug'
import path from 'path'
import { ComponentType } from 'react'
import { Handle } from 'hypermerge'
import { HypermergeUrl, createDocumentLink, isPushpinUrl } from './ShareLink'

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
  unlisted?: boolean
  resizable?: boolean
  contexts: Contexts
  create?: (typeAttrs: any, handle: Handle<any>, callback: () => void) => void
  createFromFile?: (file: File, handle: Handle<any>, callback: () => void) => void
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

function determineUrlContents(url, callback) {
  fetch(url)
    .then((response) => {
      if (!response.ok) throw Error('Fetch failed, just keep the text.')
      return response.blob()
    })
    .then((blob) => {
      if (!blob) {
        return
      }
      const { pathname } = url
      const filename = path.basename(pathname)
      const file = new File([blob], filename, { lastModified: Date.now() }) // check date.now()
      createFromFile(file, (contentUrl) => callback(contentUrl, 0))
    })
    .catch((error) => {
      // this is fine, really -- the URL upgrade to content is optional.
      // it'd be nice to do something more sophisticated, perhaps
      create('text', { text: url.toString() }, (contentUrl) => callback(contentUrl, 0))
    })
}

function importDataTransfer(dataTransfer: DataTransfer, callback) {
  const url = dataTransfer.getData('application/pushpin-url')
  if (url) {
    callback(url, 0)
    return
  }

  /* Adapted from:
    https://www.meziantou.net/2017/09/04/upload-files-and-directories-using-an-input-drag-and-drop-or-copy-and-paste-with */
  const { length } = dataTransfer.files
  // fun fact: as of this writing, onDrop dataTransfer doesn't support iterators, but onPaste does
  // hence the oldschool iteration code
  for (let i = 0; i < length; i += 1) {
    const entry = dataTransfer.files[i]
    createFromFile(entry, (url) => callback(url, i))
  }
  if (length > 0) {
    return
  }

  // If we can't get the item as a bunch of files, let's hope it works as plaintext.
  const plainText = dataTransfer.getData('text/plain')
  if (plainText) {
    try {
      // wait!? is this some kind of URL?
      const url = new URL(plainText)
      // for pushpin URLs pasted in, let's turn them into cards
      if (isPushpinUrl(plainText)) {
        callback(plainText, 0)
      } else {
        determineUrlContents(url, callback)
      }
    } catch (e) {
      // i guess it's not a URL after all, we'lll just make a text card
      create('text', { text: plainText }, (url) => callback(url, 0))
    }
  }
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

function createFromFile(file, callback): void {
  // normally we just create a file -- but we treat plain-text specially
  const type = ((mimeType) => {
    if (mimeType && mimeType.match('text/')) {
      return 'text'
    }
    return 'file'
  })(file.type)

  const entry = registry[type]
  if (!entry) {
    return
  }

  if (!entry.createFromFile) {
    throw Error(`The ${type} content type cannot be created from a file directly.`)
  }

  const url = window.repo.create() as HypermergeUrl
  const handle = window.repo.open(url)
  entry.createFromFile(file, handle, () => {
    callback(createDocumentLink(type, url))
  })
}

function create(type, attrs = {}, callback): void {
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
  createFromFile,
  create,
  importDataTransfer,
  mimeTypeToContentType, // move this too?
}

// Not yet included in / drive from the generic ContentTypes registry:
//
// * NPM packages
// * CSS includes
// * import statements
// * add function on board
