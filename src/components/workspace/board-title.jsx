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
    docId: PropTypes.string.isRequired,
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
    this.refreshHandle(this.props.docId)
    this.invitationsView = new InvitationsView(this.props.docId)
    this.invitationsView.onChange(this.onInvitationsChange)
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('click', this.handleClickOutside)
  }

  componentWillUnmount = () => {
    this.handle.release()
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('click', this.handleClickOutside)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
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

  refreshHandle = (docId) => {
    if (this.handle) {
      this.handle.release()
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  refreshBoardHandle = (boardId) => {
    if (this.boardHandle) {
      this.boardHandle.release()
    }

    this.boardHandle = window.hm.openHandle(boardId)
    this.boardHandle.onChange((doc) => {
      this.setState({ board: doc })
    })
  }

  onChange = (doc) => {
    this.setState({ ...doc }, () => {
      if (this.state.currentDocUrl) {
        const { docId } = parseDocumentLink(this.state.currentDocUrl)

        if (!this.state.board || this.state.board.docId !== docId) {
          this.refreshBoardHandle(docId)
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

    if (e.metaKey && e.key === 'Backspace') {
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
    if (e.target.className !== 'TitleBar__titleText') {
      this.deactivateOmnibox()
    }

    if ((e.target.className !== 'TitleBar__titleText') &&
        (e.target.className !== 'fa fa-edit')) {
      this.setState({ activeTitleEditor: false })
    }
  }

  handleTitleClick = (e) => {
    if (!this.state.activeTitleEditor) {
      this.activateOmnibox()
    }
  }

  activateTitleEditor = () => {
    this.setState({ activeTitleEditor: true })
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

    const selfHandle = window.hm.openHandle(this.state.selfId)

    selfHandle.change((s) => {
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

    selfHandle.release()
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
      let invitationsClasses = 'fa fa-envelope'
      if (invitations.length === 0) {
        invitationsClasses += ' hidden'
      }

      inputBar = (
        <div className="BoardTitle__actionBar">
          <div className="BoardTitle__actionBar__left">
            <i className={invitationsClasses} onClick={this.activateOmnibox} />
          </div>
          <BoardTitleInput
            active={this.state.activeTitleEditor}
            onSubmit={this.updateTitle}
            onCancel={this.cancelTitleEdit}
            defaultValue={this.state.board && this.state.board.title}
            onClick={this.activateOmnibox}
          />
          <div className="BoardTitle__actionBar__right">
            <i className="fa fa-edit" onClick={this.activateTitleEditor} />
            <i className="fa fa-clipboard" onClick={this.copyToClipboard} />
          </div>
        </div>
      )
    }

    return (
      <div ref={(ref) => { this.omniboxRef = ref }} className="BoardTitle">
        { inputBar }
        <Omnibox
          docId={this.props.docId}
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

