import { Crypto, DocUrl } from 'hypermerge'

export * from 'hypermerge/dist/Crypto'

export interface SignedValue<T> {
  value: T
  signature: Crypto.EncodedSignature
}

export function encryptionKeyPair() {
  return window.repo.crypto.encryptionKeyPair()
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
