import { Repo, RepoFrontend } from "hypermerge";

declare global {
  interface Window {
    repo: RepoFrontend
  }

  const __static: string

  interface Callback<T> {
    (error: null, value: T): void
    (error: Error): void
  }
}
