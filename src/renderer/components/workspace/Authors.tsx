import React from 'react'
import Debug from 'debug'

import { Handle } from 'hypermerge'
import Content from '../Content'
import { createDocumentLink, parseDocumentLink, HypermergeUrl } from '../../ShareLink'
import { Doc as WorkspaceDoc } from './Workspace'

import './Authors.css'

const log = Debug('pushpin:authors')

interface Props {
  hypermergeUrl: HypermergeUrl
}

interface DocWithAuthors {
  authorIds: HypermergeUrl[]
  hypermergeUrl: HypermergeUrl
}

interface State {
  board?: DocWithAuthors
  workspace?: WorkspaceDoc
}

export default class Authors extends React.PureComponent<Props, State> {
  workspaceHandle?: Handle<WorkspaceDoc>
  boardHandle?: Handle<DocWithAuthors>

  // This is the New Boilerplate
  componentWillMount = () => {
    log('componentWillMount')
    this.workspaceHandle = window.repo.watch(this.props.hypermergeUrl, (doc) =>
      this.onWorkspaceChange(doc)
    )
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
    this.workspaceHandle && this.workspaceHandle.close()
    this.boardHandle && this.boardHandle.close()
  }

  onWorkspaceChange = (doc: WorkspaceDoc) => {
    log('onWorkspaceChange')
    this.setState({ workspace: doc }, () => {
      if (this.state.workspace && this.state.workspace.currentDocUrl) {
        const { hypermergeUrl } = parseDocumentLink(this.state.workspace.currentDocUrl)

        if (!this.state.board || this.state.board.hypermergeUrl !== hypermergeUrl) {
          this.refreshBoardHandle(hypermergeUrl)
        }
      }
    })
  }

  refreshBoardHandle = (boardId: HypermergeUrl) => {
    log('refreshBoardHandle')
    if (this.boardHandle) {
      this.boardHandle.close()
    }
    this.boardHandle = window.repo.watch(boardId, (doc) => this.onBoardChange(doc))
  }

  onBoardChange = (doc: DocWithAuthors) => {
    log('onBoardChange')
    if (this.workspaceHandle && this.boardHandle) {
      this.updateIdentityReferences(this.workspaceHandle, this.boardHandle)
    }
    this.setState({ board: doc })
  }

  updateIdentityReferences = (
    workspaceHandle: Handle<WorkspaceDoc>,
    boardHandle: Handle<DocWithAuthors>
  ) => {
    log('updateIdentityReferences')
    if (!workspaceHandle || !boardHandle) {
      log('update called without both handles')
      return
    }
    const board = boardHandle.state as DocWithAuthors
    const workspace = workspaceHandle.state as WorkspaceDoc

    if (!board || !workspace) {
      return
    }

    const authorIds = board.authorIds || []
    const { selfId, contactIds = [] } = workspace

    // Add any never-before seen authors to our contacts.
    const newContactIds = authorIds.filter(
      (a: HypermergeUrl) => !contactIds.includes(a) && !(selfId === a)
    )
    if (newContactIds.length > 0) {
      workspaceHandle.change((workspace: WorkspaceDoc) => {
        workspace.contactIds.push(...newContactIds)
      })
    }

    // Add ourselves to the authors if we haven't yet.
    if (selfId && !authorIds.includes(selfId)) {
      log('updateIdentityReferences.addSelf')
      boardHandle.change((board: DocWithAuthors) => {
        if (!board.authorIds) {
          board.authorIds = []
        }
        board.authorIds.push(selfId)
      })
    }
  }

  render = () => {
    const authorIds = (this.state.board && this.state.board.authorIds) || []
    const uniqueAuthorIds = authorIds.filter((id, i, a) => a.indexOf(id) === i)
    const authors = uniqueAuthorIds.map((id: string) => (
      <Content key={id} context="title-bar" url={createDocumentLink('contact', id)} />
    ))
    return <div className="Authors">{authors}</div>
  }
}
