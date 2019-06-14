import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import InvitationsView from '../../invitations-view'
import { parseDocumentLink } from '../../share-link'
import Omnibox from './omnibox'

const log = Debug('pushpin:board-title')

export default class OmniPrompt extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired,
    openDoc: PropTypes.func.isRequired
  }

  state = {
    invitations: [],
    activeOmnibox: false,
    search: '',
    selected: null
  }

  omniboxInput = React.createRef()

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
    this.setState({ activeOmnibox: false, search: '' }, () => {
      this.omniboxInput.current.blur()
    })
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
        this.resolveDocumentSelection(selected)
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

  resolveDocumentSelection = (selected) => {
    switch (selected.type) {
      case 'contact':
        this.offerDocumentToIdentity(this.state.selected.id)
        break
      default:
        if (selected.url) {
          this.props.openDoc(selected.url)
        }
    }
  }

  handleSelectChange = (selected) => {
    this.setState({ selected })
  }

  handleClickOutside = (e) => {
    if (!e.path.includes(this.omniboxInput.current)) {
      this.deactivateOmnibox()
    }
  }

  handleTitleClick = (e) => {
    this.activateOmnibox()
    e.stopPropagation()
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

  render = () => {
    log('render')

    if (!this.state.currentDocUrl) {
      return null
    }

    const { viewedDocUrls } = this.state
    const invitations = this.state.invitations.filter((i) => (
      !viewedDocUrls.some(url => url === i.documentUrl)
    ))

    return (
      <div ref={(ref) => { this.omniboxRef = ref }} style={css.omniboxInput}>
        <input
          ref={this.omniboxInput}
          type="text"
          style={css.omniboxInputElt}
          onClick={this.handleTitleClick}
          onChange={this.handleChange}
          onKeyDown={this.handleCommandKeys}
          placeholder="Search..."
        />
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

const css = {
  omniboxInput: {
    marginLeft: '8px',
    flex: '0 1 200px',
    padding: '0px 8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  omniboxInputElt: {
    width: '336px',
    fontSize: '14px',
    color: 'var(--colorBlueBlack)',
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    background: 'var(--colorInputGrey)',
    border: '0px',
    outline: 'none',
    borderRadius: '4px',
    height: '24px',
    lineHeight: '24px'
  }

}
