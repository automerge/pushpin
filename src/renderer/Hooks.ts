import { useEffect, useState, useRef } from 'react'
import { Handle } from 'hypermerge'
import * as Hyperfile from './hyperfile'

export type ChangeFn<T> = (cb: (doc: T) => void) => void

type Cleanup = void | (() => void)

/**
 * Provides direct use of a handle inside a callback.
 *
 * @remarks
 * Only acquires a new handle when the given url changes,
 * and ensures all handles are properly closed.
 */
export function useHandle<D>(url: string | null, cb: (handle: Handle<D>) => Cleanup): void {
  useEffect(() => {
    if (!url) {
      return () => {}
    }

    // TODO: add useRepo and Repo react context
    const handle = window.repo.open(url)

    const cleanup = cb(handle)

    return () => {
      handle.close()
      cleanup && cleanup()
    }
  }, [url])
}

export function useDocument<D>(url: string | null): [Readonly<D> | null, ChangeFn<D>] {
  const [doc, setDoc] = useState<D | null>(null)

  useHandle<D>(url, (handle) => {
    handle.subscribe((doc) => setDoc(doc))

    return () => {
      setDoc(null)
    }
  })

  function change(cb: (doc: D) => void): void {
    if (url) {
      window.repo.change(url, cb)
    }
  }

  return [doc, change]
}

export function useMessaging<M>(url: string | null, onMsg: (msg: M) => void): (msg: M) => void {
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

export function useHyperfile(url: Hyperfile.HyperfileUrl | null): Uint8Array | null {
  const [data, setData] = useState<Uint8Array | null>(null)

  useEffect(() => {
    data && setData(null)
    url && Hyperfile.fetch(url).then(setData)
  }, [url])

  return data
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
 * Manages the state and events for an input element for which the input
 *
 * @remarks
 * Returns `[value, onEvent]`.
 * Pass `value` to the input's `value` prop, and
 * pass `onEvent` to both `onChange` and `onKeyDown`.
 */
export function useConfirmableInput(
  value: string,
  onConfirm: (val: string) => string | null
): [string, (e: InputEvent) => void] {
  const [str, setStr] = useState<string | null>(value)

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setStr(e.target.value)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter': {
        const result = onConfirm(str || value)

        if (typeof result === 'string') {
          setStr(null)
          e.currentTarget.blur()
        }
        break
      }

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

  return [str || value, onEvent]
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
