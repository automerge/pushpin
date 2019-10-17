/* eslint-disable */
import { Repo, RepoFrontend } from 'hypermerge'

declare global {
  interface Window {
    repo: RepoFrontend
    _debug: any
  }

  const __static: string

  interface Callback<T> {
    (error: null, value: T): void
    (error: Error): void
  }

  interface Blob {
    stream(): ReadableStream<Uint8Array>
  }
}
