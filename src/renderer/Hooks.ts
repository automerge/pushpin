import { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react'
import { Handle, RepoFrontend, HyperfileUrl } from 'hypermerge'
import * as Hyperfile from './hyperfile'
import { HypermergeUrl } from './ShareLink'
import SelfContext from './components/SelfContext'
import { ContactDoc } from './components/content-types/contact'

export type ChangeFn<T> = (cb: (doc: T) => void) => void

type Cleanup = void | (() => void)

export const RepoContext = createContext<RepoFrontend | null>(null)

export function useRepo(): RepoFrontend {
  const repo = useContext(RepoContext)

  if (!repo) {
    throw new Error('Repo not available on RepoContext.')
  }

  return repo
}

export function useSelfId(): HypermergeUrl {
  return useContext(SelfContext)
}

export function useSelf(): [Readonly<ContactDoc> | null, ChangeFn<ContactDoc>] {
  const selfId = useSelfId()
  return useDocument<ContactDoc>(selfId)
}

/**
 * Provides direct use of a handle inside a callback.
 *
 * @remarks
 * Only acquires a new handle when the given url changes,
 * and ensures all handles are properly closed.
 */
export function useHandle<D>(
  url: HypermergeUrl | null,
  cb: (handle: Handle<D>) => Cleanup
): RepoFrontend {
  const repo = useRepo()

  useEffect(() => {
    if (!url) {
      return () => {}
    }

    const handle = repo.open(url)

    const cleanup = cb(handle)

    return () => {
      handle.close()
      cleanup && cleanup()
    }
  }, [url])

  return repo
}

export function useDocument<D>(url: HypermergeUrl | null): [Readonly<D> | null, ChangeFn<D>] {
  const [doc, setDoc] = useState<D | null>(null)

  const repo = useHandle<D>(url, (handle) => {
    handle.subscribe((doc) => setDoc(doc))

    return () => {
      setDoc(null)
    }
  })

  const change = useCallback(
    (cb: (doc: D) => void) => {
      if (url) {
        repo.change(url, cb)
      }
    },
    [url]
  )

  return [doc, change]
}

export function useDocumentReducer<D, A>(
  url: HypermergeUrl | null,
  reducer: (doc: D, action: A) => void
): [D | null, (action: A) => void] {
  const [doc, changeDoc] = useDocument<D>(url)

  const dispatch = useCallback((action: A) => {
    changeDoc((doc) => {
      reducer(doc, action)
    })
  }, [])

  return [doc, dispatch]
}

export function useMessaging<M>(
  url: HypermergeUrl | null,
  onMsg: (msg: M) => void
): (msg: M) => void {
  const [sendObj, setSend] = useState<{ send: (msg: M) => void }>({ send() {} })

  // Without this ref, we'd close over the `onMsg` passed during the very first render.
  // Instead, we close over the ref object and can be sure we're always reading
  // the latest onMsg callback.
  const onMsgRef = useRef(onMsg)
  onMsgRef.current = onMsg

  useHandle(url, (handle) => {
    handle.subscribeMessage((msg: M) => onMsgRef.current(msg))
    setSend({ send: handle.message })

    return () => {
      onMsgRef.current = () => {}
      setSend({ send() {} })
    }
  })
  return sendObj.send
}

const heartbeats: { [url: string]: number } = {} // url: HypermergeUrl
const HEARTBEAT_INTERVAL = 1000 // ms

export function useAllHeartbeats(selfId: HypermergeUrl | null) {
  const repo = useRepo()

  useEffect(() => {
    if (!selfId) {
      return () => {}
    }

    const interval = setInterval(() => {
      // Post on the self-contact ID that we're online.
      // This means any avatar anywhere will have a colored ring around it
      // if that user is online.
      repo.message(selfId, 'heartbeat')

      // Post a presence heartbeat on documents currently considered
      // to be open, allowing any kind of card to render a list of "present" folks.
      Object.entries(heartbeats).forEach(([url, count]) => {
        if (count > 0) {
          // we can't use HypermergeUrl as a key in heartbeats, so we do this bad thign
          repo.message(url as HypermergeUrl, {
            contact: selfId,
            heartbeat: true,
            presence: myPresence[url],
          })
        } else {
          depart(url as HypermergeUrl)
          delete heartbeats[url]
        }
      })
    }, HEARTBEAT_INTERVAL)

    function depart(url: HypermergeUrl) {
      repo.message(url, { contact: selfId, departing: true })
    }

    return () => {
      clearInterval(interval)
      // heartbeats can't have HypermergeUrls as keys, so we do this
      Object.entries(heartbeats).forEach(([url]) => depart(url as HypermergeUrl))
    }
  }, [selfId])
}

export function useHeartbeat(docUrl: HypermergeUrl | null) {
  useEffect(() => {
    if (!docUrl) {
      return () => {}
    }

    heartbeats[docUrl] = (heartbeats[docUrl] || 0) + 1

    return () => {
      heartbeats[docUrl] && (heartbeats[docUrl] -= 1)
    }
  }, [])
}

export interface RemotePresence<P> {
  [contactUrl: string]: P | undefined
}

const myPresence: { [url: string]: { [key: string]: any } } = {}

export function usePresence<P>(
  url: HypermergeUrl | null,
  presence: P | null,
  key: string = '/'
): RemotePresence<P> {
  const [remote, setRemote] = useState<RemotePresence<P>>({})

  useMessaging<any>(url, (msg: any) => {
    if (msg.heartbeat && msg.presence) {
      setRemote((rest) => ({ ...rest, [msg.contact]: msg.presence[key] }))
    } else if (msg.departing) {
      setRemote(({ [msg.contact]: _, ...rest }) => rest)
    }
  })

  useEffect(() => {
    if (!url || !key) return () => {}

    if (!myPresence[url]) {
      myPresence[url] = {}
    }

    myPresence[url][key] = presence

    return () => {
      delete myPresence[url][key]
    }
  }, [key, presence])

  return remote
}

export function useHyperfile(url: HyperfileUrl | null): Hyperfile.HyperfileResult | null {
  const [data, setData] = useState<Hyperfile.HyperfileResult | null>(null)

  useEffect(() => {
    data && setData(null)
    url && Hyperfile.fetch(url).then(([data, mimeType, size]) => setData({ data, mimeType, size }))
  }, [url])

  return data
}

export function useHyperfileBuffer(
  url: HyperfileUrl | null
): Hyperfile.BufferedHyperfileResult | null {
  const [buffered, setBuffered] = useState<Hyperfile.BufferedHyperfileResult | null>(null)
  const data = useHyperfile(url)

  useEffect(() => {
    buffered && setBuffered(null)
    data &&
      Hyperfile.streamToBuffer(data.data).then((buffer) =>
        setBuffered({ data: buffer, mimeType: data.mimeType })
      )
  }, [data])

  return buffered
}

export function useInterval(ms: number, cb: () => void, deps: any[]) {
  useEffect(() => {
    const id = setInterval(cb, ms)

    return () => {
      clearInterval(id)
    }
  }, deps)
}

/**
 * Starts a timeout when `cond` is first set to true.
 * The timeout can be restarted by calling the returned `reset` function.
 *
 * @remarks
 * The timeout is cancelled when `cond` is set to false.
 */
export function useTimeoutWhen(cond: boolean, ms: number, cb: () => void) {
  const reset = useRef(() => {})

  useEffect(() => {
    if (!cond) {
      reset.current = () => {}
      return () => {}
    }

    let id: NodeJS.Timeout

    reset.current = () => {
      id != null && clearTimeout(id)
      id = setTimeout(cb, ms)
    }

    reset.current()

    return () => {
      clearTimeout(id)
    }
  }, [cond])

  return () => reset.current()
}

type InputEvent = React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>

/**
 * Manages the state and events for an input element for which the input's value
 * is only needed after a confirmation via the enter key.
 *
 * @remarks
 * Returns `[value, onEvent]`.
 * Pass `value` to the input's `value` prop, and
 * pass `onEvent` to both `onChange` and `onKeyDown`.
 */
export function useConfirmableInput(
  value: string,
  onConfirm: (val: string) => void
): [string, (e: InputEvent) => void] {
  const [str, setStr] = useState<string | null>(null)

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setStr(e.target.value)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter':
        if (str !== null) {
          onConfirm(str)
          setStr(null)
        }
        e.currentTarget.blur()
        break

      case 'Backspace':
        e.stopPropagation()
        break

      case 'Escape':
        e.currentTarget.blur()
        setStr(null)
        break
    }
  }

  function onEvent(e: InputEvent) {
    switch (e.type) {
      case 'change':
        onChange(e as React.ChangeEvent<HTMLInputElement>)
        break
      case 'keydown':
        onKeyDown(e as React.KeyboardEvent<HTMLInputElement>)
        break
    }
  }

  return [str != null ? str : value, onEvent]
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
/**
 * Creates a constant reference for the given function.
 * Always returns the same function.
 *
 * @remarks
 *
 * `useCallback` closes over the deps at the time they're passed in, whereas `useStaticCallback`
 * always calls the latest callback. This is generally a good thing, but it's worth noting that it
 * could result in a race condition.
 */
export function useStaticCallback<T extends (...args: any[]) => any>(callback: T): T {
  const cb = useRef<T>(callback)
  cb.current = callback

  return useCallback((...args: any[]) => cb.current(...args), []) as T
}
