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
