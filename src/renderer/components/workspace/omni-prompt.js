import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import InvitationsView from '../../invitations-view'
import Omnibox from './omnibox'

const log = Debug('pushpin:board-title')

export default class OmniPrompt extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired
  }

  state = {
    invitations: [],
    activeOmnibox: false,
    search: ''
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

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  /* end... slightly modified boilerplate */

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

  handleClickOutside = (e) => {
    if (!e.path.includes(this.omniboxInput.current)) {
      this.deactivateOmnibox()
    }
  }

  handleTitleClick = (e) => {
    this.activateOmnibox()
    e.stopPropagation()
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
          placeholder="Search..."
        />

        <Omnibox
          hypermergeUrl={this.props.hypermergeUrl}
          visible={this.state.activeOmnibox}
          search={this.state.search}
          invitations={invitations}
          omniboxFinished={this.deactivateOmnibox}
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
