import { useEffect, useState } from 'react'

export type ChangeFn<T> = (cb: (doc: T) => void) => void

export function useDocument<D>(url: string | null): [D | null, ChangeFn<D>] {
  const [doc, setDoc] = useState<D | null>(null)

  useEffect(() => {
    if (!url) {
      setDoc(null)
      return () => {}
    }

    const handle = window.repo.watch(url, (doc: D) => setDoc(doc))

    return () => {
      handle.close()
    }
  }, [url])

  function change(cb: (doc: D) => void): void {
    if (url) {
      window.repo.change(url, cb)
    }
  }

  return [doc, change]
}

export function useEvent<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  cb: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
): void
export function useEvent<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  cb: (this: Document, ev: DocumentEventMap[K]) => any
): void
export function useEvent<K extends string>(
  target: Node,
  type: K,
  cb: (this: Node, ev: Event) => void
): void {
  useEffect(() => {
    target.addEventListener(type, cb)

    return () => {
      target.removeEventListener(type, cb)
    }
  }, [target, type, cb])
}
