import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { clipboard } from 'electron'

import BoardTitleInput from './board-title-input'
import { parseDocumentLink } from '../../share-link'

const log = Debug('pushpin:board-title')

export default class BoardTitle extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired,
    openDoc: PropTypes.func.isRequired
  }

  state = {
    activeTitleEditor: false,
    selected: null
  }

  titleInput = React.createRef()

  // This is the New Boilerplate
  componentDidMount = () => {
    this.refreshHandle(this.props.hypermergeUrl)
    document.addEventListener('click', this.handleClickOutside)
  }

  componentWillUnmount = () => {
    this.handle.close()
    document.removeEventListener('click', this.handleClickOutside)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }

  refreshBoardHandle = (boardId) => {
    if (this.boardHandle) {
      this.boardHandle.close()
    }

    this.boardHandle = window.repo.watch(boardId, (doc) => {
      this.setState({ board: doc })
    })
  }

  onChange = (doc) => {
    this.setState({ ...doc }, () => {
      if (this.state.currentDocUrl) {
        const { hypermergeUrl } = parseDocumentLink(this.state.currentDocUrl)

        if (!this.state.board || this.state.board.hypermergeUrl !== hypermergeUrl) {
          this.refreshBoardHandle(hypermergeUrl)
        }
      }
    })
  }

  handleCommandKeys = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const { selected } = this.state

      if (selected) {
        if (selected.type === 'contact') {
          this.offerDocumentToIdentity(this.state.selected.id)
        } else if (selected.url) {
          this.props.openDoc(selected.url)
        }
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
      e.preventDefault()
      const { selected } = this.state

      if (selected && selected.type === 'viewedDocUrl') {
        this.handle.change((doc) => {
          if (!doc.archivedDocUrls) {
            doc.archivedDocUrls = []
          }

          if (!doc.archivedDocUrls.includes(selected.url)) {
            doc.archivedDocUrls.push(selected.url)
          }
        })
      }
    }
  }

  handleSelectChange = (selected) => {
    this.setState({ selected })
  }

  handleClickOutside = (e) => {
    if (this.state.activeTitleEditor) {
      return
    }

    if (e.target.className.match('BoardTitle__envelope')
      || e.target.className.match('BoardTitle__actionBar')) {
      return
    }

    if ((e.target.className !== 'TitleBar__titleText')
        && (e.target.className !== 'fa fa-edit')) {
      this.setState({ activeTitleEditor: false })
    }
  }

  handleTitleClick = (e) => {
    e.stopPropagation()
  }

  activateTitleEditor = (e) => {
    this.setState({ activeTitleEditor: true })
    e.stopPropagation()
  }

  updateTitle = (value) => {
    this.boardHandle.change((doc) => {
      doc.title = value
    })

    this.setState({ activeTitleEditor: false })
  }

  cancelTitleEdit = () => {
    this.setState({ activeTitleEditor: false })
  }

  offerDocumentToIdentity = (contactId) => {
    if (!this.state.selfId) {
      return
    }

    window.repo.change(this.state.selfId, (s) => {
      if (!s.offeredUrls) {
        s.offeredUrls = {}
      }

      if (!s.offeredUrls[contactId]) {
        s.offeredUrls[contactId] = []
      }

      if (!s.offeredUrls[contactId].includes(this.state.currentDocUrl)) {
        s.offeredUrls[contactId].push(this.state.currentDocUrl)
      }
    })
  }

  copyToClipboard = (e) => {
    clipboard.writeText(this.state.currentDocUrl)
  }

  render = () => {
    log('render')

    if (!this.state.currentDocUrl) {
      return null
    }

    const { type } = parseDocumentLink(this.state.currentDocUrl)

    const inputBar = (
      <div className="BoardTitle__actionBar" onClick={this.handleTitleClick}>
        <div className="BoardTitle__actionBar__left">
          <i className="BoardTitle__labeledIcon BoardTitle__clipboard fa fa-clipboard" onClick={this.copyToClipboard} />
        </div>
        <BoardTitleInput
          active={this.state.activeTitleEditor}
          onSubmit={this.updateTitle}
          onCancel={this.cancelTitleEdit}
          defaultValue={this.state.board && this.state.board.title || `Untitled ${type}...`}
          onClick={this.activateTitleEditor}
        />
      </div>
    )

    return (
      <div className="BoardTitle">
        { inputBar }
      </div>
    )
  }
}
