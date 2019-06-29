import { useEffect, useState } from "react";

export function useDocument<T>(url) {
  const [doc, setDoc] = useState<T | null>(null)

  useEffect(() => {
    const handle = window.repo.watch(url, (doc: T) => setDoc(doc))

    return () => {
      handle.close()
    }
  })

  return doc
}
