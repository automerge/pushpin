import Base58 from 'bs58'
import { crc16 } from 'js-crc'

/** share link helper functions
 * lifted and adapted from pixelpusher
 */

export const shareLinkForDocument = (type, id) =>
  withCrc(`pushpin://${type}/${encode(id)}`)

export const parseDocumentLink = link => {
  if (!link) {
    throw new Error('Cannot parse an empty value as a link.')
  }

  const { nonCrc, crc, scheme, type, docId } = parts(link)

  if (!isValidCRCShareLink(nonCrc, crc)) {
    throw new Error(`Failed CRC check: ${crc16(nonCrc)} should have been ${crc}`)
  }

  if (scheme !== 'pushpin') {
    throw new Error(`Invalid url scheme: ${scheme} (expected pushpin)`)
  }

  if (docId.length !== 64) {
    throw new Error(`Invalid docId: ${docId} (should be length 64)`)
  }

  if (!type) {
    throw new Error(`Missing type in ${this.props.url}`)
  }

  return { scheme, type, docId }
}

export const isValidCRCShareLink = (nonCrc, crc) =>
  Boolean(nonCrc) && Boolean(crc) && crc16(nonCrc) === crc

export const parts = str => {
  const p = encodedParts(str)

  return {
    scheme: p.scheme,
    type: p.type,
    docId: p.docId && decode(p.docId),
    nonCrc: p.nonCrc,
    crc: p.crc && decode(p.crc),
  }
}

export const encodedParts = str => {
  const [/* whole match */, nonCrc, scheme, type, docId, crc] = str.match(/^((\w+):\/\/(.+)\/(\w+))\/(\w{1,4})$/) || []
  return { nonCrc, scheme, type, docId, crc }
}

export const withCrc = str =>
  `${str}/${encode(crc16(str))}`

export const encode = str =>
  Base58.encode(hexToBuffer(str))

export const decode = str =>
  bufferToHex(Base58.decode(str))

export const hexToBuffer = key =>
  (Buffer.isBuffer(key)
    ? key
    : Buffer.from(key, 'hex'))

export const bufferToHex = key =>
  (Buffer.isBuffer(key)
    ? key.toString('hex')
    : key)
