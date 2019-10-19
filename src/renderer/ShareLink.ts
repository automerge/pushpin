import Base58 from 'bs58'

/** share link helper functions
 * lifted and adapted from pixelpusher
 */
import { DocUrl } from 'hypermerge'
import { Freeze } from 'automerge'

export type HypermergeUrl = DocUrl
export type PushpinUrl = string & Freeze<{ pushpin: true }>

export function isHypermergeUrl(str: string): str is HypermergeUrl {
  return /^hypermerge:\/\w+$/.test(str)
}

export function isPushpinUrl(str: string): str is PushpinUrl {
  return /^hypermerge:\/.+\/?\?pushpinContentType=(\w+)$/.test(str)
}

export function createDocumentLink(type: string, url: HypermergeUrl): PushpinUrl {
  if (!url.match('hypermerge:/')) {
    throw new Error('expecting a hypermerge URL as input')
  }
  if (url.match('pushpinContentType')) {
    throw new Error('so-called ID contains "pushpin". you appear to have passed a URL as an ID')
  }

  const id = url.substring(12)

  if (!type) {
    throw new Error('no type when creating URL')
  }
  return `hypermerge:/${id}?pushpinContentType=${type}` as PushpinUrl
}

interface Parts {
  scheme: string
  type: string
  docId: string
  hypermergeUrl: HypermergeUrl
}

export function parseDocumentLink(link: string): Parts {
  if (!link) {
    throw new Error('Cannot parse an empty value as a link.')
  }

  const { scheme, type, docId } = parts(link)

  if (scheme !== 'hypermerge') {
    throw new Error(`Invalid url scheme: ${scheme} (expected hypermerge)`)
  }

  if (!type) {
    throw new Error(`Missing type in ${link}`)
  }

  if (!docId) {
    throw new Error(`Missing docId in ${link}`)
  }

  const hypermergeUrl = `hypermerge:/${docId}` as HypermergeUrl

  return { scheme, type, docId, hypermergeUrl }
}

export function parts(str: string) {
  const p = encodedParts(str)

  return {
    scheme: p.scheme,
    type: p.type,
    docId: p.docId,
  }
}

export const encodedParts = (str: string) => {
  // ugly
  const [, /* whole match */ scheme, docId, type] = str.match(
    /^(\w+):\/(\w+)\?pushpinContentType=(\w+)$/
  ) || [undefined, undefined, undefined, undefined]
  return { scheme, type, docId }
}

export const encode = (str: string) => Base58.encode(hexToBuffer(str))

export const decode = (str: string) => bufferToHex(Base58.decode(str))

export const hexToBuffer = (key: string | Buffer) =>
  Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex')

export const bufferToHex = (key: Buffer | string) =>
  Buffer.isBuffer(key) ? key.toString('hex') : key
