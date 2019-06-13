import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { clipboard } from 'electron'

import BoardTitleInput from './board-title-input'
import InvitationsView from '../../invitations-view'
import { parseDocumentLink } from '../../share-link'
import Omnibox from './omnibox'

const log = Debug('pushpin:board-title')

export default class BoardTitle extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired,
    openDoc: PropTypes.func.isRequired
  }

  state = {
    invitations: [],
    activeOmnibox: false,
    activeTitleEditor: false,
    search: '',
    selected: null
  }

  omniboxInput = React.createRef()
  titleInput = React.createRef()

  // This is the New Boilerplate
  componentDidMount = () => {
    this.refreshHandle(this.props.hypermergeUrl)
    this.invitationsView = new InvitationsView(this.props.hypermergeUrl)
    this.invitationsView.onChange(this.onInvitationsChange)
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('click', this.handleClickOutside)
  }

  componentWillUnmount = () => {
    this.handle.close()
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('click', this.handleClickOutside)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  onInvitationsChange = (invitations) => {
    log('invitations change')
    this.setState({ invitations }, () => this.forceUpdate())
  }

  onKeyDown = (e) => {
    if (e.key === '/' && document.activeElement === document.body) {
      if (!this.state.activeOmnibox) {
        this.activateOmnibox()
        e.preventDefault()
      }
    }
    if (e.key === 'Escape' && this.state.activeOmnibox) {
      this.deactivateOmnibox()
      e.preventDefault()
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

  activateOmnibox = () => {
    this.setState({ activeOmnibox: true }, () => {
      this.omniboxInput.current.focus()
    })
  }

  deactivateOmnibox = () => {
    this.setState({ activeOmnibox: false, search: '' })
  }

  handleChange = (e) => {
    this.setState({ search: e.target.value })
  }

  handleCommandKeys = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      this.omniboxControl.moveDown()
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      this.omniboxControl.moveUp()
    }

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

      this.deactivateOmnibox()
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

    if (e.target.className !== 'TitleBar__titleText') {
      this.deactivateOmnibox()
    }

    if ((e.target.className !== 'TitleBar__titleText')
        && (e.target.className !== 'fa fa-edit')) {
      this.setState({ activeTitleEditor: false })
    }
  }

  handleTitleClick = (e) => {
    if (!this.state.activeTitleEditor) {
      this.activateOmnibox()
    }
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

  setOmniboxControl = (controller) => {
    this.omniboxControl = controller
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

    const { viewedDocUrls } = this.state
    const invitations = this.state.invitations.filter((i) => (
      !viewedDocUrls.some(url => url === i.documentUrl)
    ))

    let inputBar
    if (this.state.activeOmnibox) {
      inputBar = (
        <input
          ref={this.omniboxInput}
          type="text"
          className="TitleBar__titleText BoardTitle__omniboxInput"
          onChange={this.handleChange}
          onKeyDown={this.handleCommandKeys}
          placeholder="Start typing..."
        />
      )
    } else {
      let invitationsClasses = 'BoardTitle__labeledIcon BoardTitle__envelope fa fa-envelope'
      if (invitations.length === 0) {
        invitationsClasses += ' hidden'
      }

      inputBar = (
        <div className="BoardTitle__actionBar" onClick={this.handleTitleClick}>
          <div className="BoardTitle__actionBar__left">
            <i className={invitationsClasses} />
          </div>
          <BoardTitleInput
            active={this.state.activeTitleEditor}
            onSubmit={this.updateTitle}
            onCancel={this.cancelTitleEdit}
            defaultValue={this.state.board && this.state.board.title || ''}
          />
          <div className="BoardTitle__actionBar__right">
            <i className="BoardTitle__labeledIcon BoardTitle__edit fa fa-edit" onClick={this.activateTitleEditor} />
            <i className="BoardTitle__labeledIcon BoardTitle__clipboard fa fa-clipboard" onClick={this.copyToClipboard} />
          </div>
        </div>
      )
    }

    return (
      <div ref={(ref) => { this.omniboxRef = ref }} className="BoardTitle">
        { inputBar }
        <Omnibox
          hypermergeUrl={this.props.hypermergeUrl}
          visible={this.state.activeOmnibox}
          search={this.state.search}
          getKeyController={this.setOmniboxControl}
          invitations={invitations}
          onSelectChange={this.handleSelectChange}
        />
      </div>
    )
  }
}
