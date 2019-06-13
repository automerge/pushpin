import { Repo } from "hypermerge/dist"

declare global {
  interface Window {
    repo: Repo
  }
}
