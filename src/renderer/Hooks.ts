import { useEffect, useState } from "react"

type ChangeFn<T> = (cb: (doc: T) => void) => void

export function useDocument<T>(url: string): [T | null, ChangeFn<T>] {
  const [doc, setDoc] = useState<T | null>(null)

  useEffect(() => {
    const handle = window.repo.watch(url, (doc: T) => setDoc(doc))

    return () => {
      handle.close()
    }
  }, [url])

  function change(cb: (doc: T) => void): void {
    window.repo.change(url, cb)
  }

  return [doc, change]
}
