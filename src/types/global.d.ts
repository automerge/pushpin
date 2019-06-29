import { Repo, RepoFrontend } from "hypermerge";

declare global {
  interface Window {
    repo: RepoFrontend
  }

  const __static: string
}
