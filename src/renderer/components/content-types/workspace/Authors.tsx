import React, { useEffect } from 'react'
import Debug from 'debug'

import { parseDocumentLink, HypermergeUrl } from '../../../ShareLink'
import { Doc as WorkspaceDoc } from './Workspace'
import Author from './Author'

import './Authors.css'
import { useDocument } from '../../../Hooks'

const log = Debug('pushpin:authors')

interface Props {
  hypermergeUrl: HypermergeUrl
}

interface DocWithAuthors {
  authorIds: HypermergeUrl[]
  hypermergeUrl: HypermergeUrl
}

export default function Authors(props: Props) {
  const authorIds = useAuthors(props.hypermergeUrl)
  const authors = authorIds
    .filter((id, i, a) => a.indexOf(id) === i)
    .map((id) => <Author key={id} contactId={id} />)

  return <div className="Authors">{authors}</div>
}

export function useAuthors(workspaceUrl: HypermergeUrl): HypermergeUrl[] {
  const [workspace, changeWorkspace] = useDocument<WorkspaceDoc>(workspaceUrl)
  const { hypermergeUrl = null } = workspace ? parseDocumentLink(workspace.currentDocUrl) : {}
  const [board, changeBoard] = useDocument<DocWithAuthors>(hypermergeUrl)
  const selfId = workspace && workspace.selfId

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
