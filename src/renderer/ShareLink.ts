import Base58 from 'bs58'
import * as url from 'url'
import * as querystring from 'querystring'

/** share link helper functions
 * lifted and adapted from pixelpusher
 */
import { DocUrl, HyperfileUrl } from 'hypermerge'

export type HypermergeUrl = DocUrl
export type PushpinUrl = string & { pushpin: true }

export function isHypermergeUrl(str: string): str is HypermergeUrl {
  return url.parse(str).protocol === 'hypermerge:'
}

export function isHyperfileUrl(str: string): str is HyperfileUrl {
  return url.parse(str).protocol === 'hyperfile:'
}

export function isPushpinUrl(str: string): str is PushpinUrl {
  const { protocol, query } = url.parse(str)
  return protocol === 'hypermerge:' && /^pushpinContentType=/.test(query || '')
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

  return { scheme, type, hypermergeUrl }
}

export function parts(str: string) {
  const { protocol, pathname, query } = url.parse(str)
  return {
    scheme: protocol ? protocol.substr(0, protocol.length - 1) : '',
    type: querystring.parse(query || '').pushpinContentType.toString(),
    docId: (pathname || '').substr(1),
  }
}

export const encode = (str: string) => Base58.encode(hexToBuffer(str))

export const decode = (str: string) => bufferToHex(Base58.decode(str))

export const hexToBuffer = (key: string | Buffer) =>
  Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex')

export const bufferToHex = (key: Buffer | string) =>
  Buffer.isBuffer(key) ? key.toString('hex') : key
