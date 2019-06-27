import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import Content from '../Content'
import { createDocumentLink, parseDocumentLink } from '../../share-link'

const log = Debug('pushpin:authors')

export default class Authors extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired // Workspace
  }

  // This is the New Boilerplate
  componentWillMount = () => {
    log('componentWillMount')
    this.refreshWorkspaceHandle(this.props.hypermergeUrl)
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
    this.workspaceHandle.close()
    this.boardHandle.close()
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshWorkspaceHandle = (hypermergeUrl) => {
    log('refreshWorkspaceHandle')
    if (this.workspaceHandle) {
      this.workspaceHandle.close()
    }
    this.workspaceHandle = window.repo.watch(hypermergeUrl, (doc) => this.onWorkspaceChange(doc))
  }

  refreshBoardHandle = (boardId) => {
    log('refreshBoardHandle')
    if (this.boardHandle) {
      this.boardHandle.close()
    }
    this.boardHandle = window.repo.watch(boardId, (doc) => this.onBoardChange(doc))
  }

  onBoardChange = (doc) => {
    log('onBoardChange')
    this.updateIdentityReferences(this.workspaceHandle, this.boardHandle)
    this.setState({ board: doc })
  }

  onWorkspaceChange = (doc) => {
    log('onWorkspaceChange')
    this.setState({ workspace: doc }, () => {
      if (this.state.workspace.currentDocUrl) {
        const { hypermergeUrl } = parseDocumentLink(this.state.workspace.currentDocUrl)

        if (!this.state.board || this.state.board.hypermergeUrl !== hypermergeUrl) {
          this.refreshBoardHandle(hypermergeUrl)
        }
      }
    })
  }

  updateIdentityReferences = (workspaceHandle, boardHandle) => {
    log('updateIdentityReferences')
    if (!workspaceHandle || !boardHandle) {
      log('update called without both handles')
      return
    }
    const { authorIds = [] } = boardHandle.state || {}
    const { selfId, contactIds = [] } = workspaceHandle.state || {}

    // no work required if there's no board...
    if (!boardHandle.state) {
      return
    }

    // Add any never-before seen authors to our contacts.
    const newContactIds = authorIds.filter((a) => !contactIds.includes(a) && !(selfId === a))
    if (newContactIds.length > 0) {
      workspaceHandle.change((workspace) => {
        workspace.contactIds.push(...newContactIds)
      })
    }

    // Add ourselves to the authors if we haven't yet.
    if (selfId && !authorIds.includes(selfId)) {
      log('updateIdentityReferences.addSelf')
      boardHandle.change((board) => {
        if (!board.authorIds) {
          board.authorIds = []
        }
        board.authorIds.push(selfId)
      })
    }
  }

  render = () => {
    const { authorIds = [] } = (this.state.board || {})
    const uniqueAuthorIds = authorIds.filter((id, i, a) => (a.indexOf(id) === i))
    const authors = uniqueAuthorIds.map(id => (
      <Content
        key={id}
        context="title-bar"
        url={createDocumentLink('contact', id)}
      />
    ))
    return (
      <div className="Authors">
        {authors}
      </div>
    )
  }
}
