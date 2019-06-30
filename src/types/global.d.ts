/* eslint-disable */
import { Repo, RepoFrontend } from 'hypermerge'

declare global {
  interface Window {
    repo: RepoFrontend
  }
}
