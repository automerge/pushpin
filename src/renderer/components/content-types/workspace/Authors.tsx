import React, { useEffect } from 'react'
import Debug from 'debug'

import { HypermergeUrl } from '../../../ShareLink'
import { Doc as WorkspaceDoc } from './Workspace'
import Author from './Author'

import './Authors.css'
import { useDocument } from '../../../Hooks'
import { useSelfId } from '../../../SelfHooks'
import { usePresence } from '../../../PresenceHooks'

const log = Debug('pushpin:authors')

interface Props {
  workspaceUrl: HypermergeUrl
  currentDocUrl: HypermergeUrl
}

interface DocWithAuthors {
  authorIds: HypermergeUrl[]
  hypermergeUrl: HypermergeUrl
}

export default function Authors({ workspaceUrl, currentDocUrl }: Props) {
  const authorIds = useAuthors(currentDocUrl, workspaceUrl)
  const presence = usePresence(currentDocUrl)

  // Remove self from the authors list.
  const selfId = useSelfId()
  const authors = authorIds
    .filter((authorId) => authorId !== selfId)
    .filter((id, i, a) => a.indexOf(id) === i)
    .map((id) => (
      <Author key={id} contactId={id} isPresent={presence.some((p) => p.contact === id)} />
    ))

  return <div className="Authors">{authors}</div>
}

export function useAuthors(
  currentDocUrl: HypermergeUrl,
  workspaceUrl: HypermergeUrl
): HypermergeUrl[] {
  const [workspace, changeWorkspace] = useDocument<WorkspaceDoc>(workspaceUrl)
  const [board, changeBoard] = useDocument<DocWithAuthors>(currentDocUrl)
  const selfId = useSelfId()

  useEffect(() => {
    if (!workspace || !board) {
      return
    }

    log('updating workspace contacts')

    const { authorIds = [] } = board

    // Add any never-before seen authors to our contacts.
    changeWorkspace(({ contactIds }) => {
      const newContactIds = authorIds.filter((a) => selfId !== a && !contactIds.includes(a))

      if (newContactIds.length) {
        contactIds.push(...newContactIds)
      }
    })
  }, [selfId, board && board.authorIds])

  useEffect(() => {
    if (!workspace || !board) {
      return
    }

    log('adding self to authors')

    // Add ourselves to the authors if we haven't yet.
    changeBoard((board) => {
      if (!board.authorIds) {
        board.authorIds = []
      }

      if (selfId && !board.authorIds.includes(selfId)) {
        board.authorIds.push(selfId)
      }
    })
  }, [selfId, board ? board.authorIds : false])

  return (board && board.authorIds) || []
}
