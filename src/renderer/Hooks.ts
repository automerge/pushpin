import { useEffect, useState } from 'react'

export type ChangeFn<T> = (cb: (doc: T) => void) => void

export function useDocument<T>(url: string | null): [T | null, ChangeFn<T>] {
  const [doc, setDoc] = useState<T | null>(null)

  useEffect(() => {
    if (!url) {
      setDoc(null)
      return () => {}
    }

    const handle = window.repo.watch(url, (doc: T) => setDoc(doc))

    return () => {
      handle.close()
    }
  }, [url])

  function change(cb: (doc: T) => void): void {
    if (url) window.repo.change(url, cb)
  }

  return [doc, change]
}
