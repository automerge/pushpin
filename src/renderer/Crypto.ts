import { Crypto, DocUrl } from 'hypermerge'

export * from 'hypermerge/dist/Crypto'

export interface SignedValue<T> {
  value: T
  signature: Crypto.EncodedSignature
}

export interface Box {
  box: Crypto.EncodedBox
  nonce: Crypto.EncodedBoxNonce
}

export function encryptionKeyPair() {
  return window.repo.crypto.encryptionKeyPair()
}

export async function verifiedValue<T extends string>(
  url: DocUrl,
  signedValue?: SignedValue<T>
): Promise<T | null> {
  if (!signedValue) return null
  const verified = await verify(url, signedValue)
  return verified ? signedValue.value : null
}

export async function sign<T extends string>(url: DocUrl, value: T): Promise<SignedValue<T>> {
  const signature = await window.repo.crypto.sign(url, value)
  return { value, signature }
}

export async function verify<T extends string>(
  url: DocUrl,
  signedValue: SignedValue<T>
): Promise<boolean> {
  const isValid = await window.repo.crypto.verify(url, signedValue.value, signedValue.signature)
  return isValid
}
