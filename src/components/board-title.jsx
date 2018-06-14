import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { RIEInput } from 'riek'

import Content from './content'
import ContentTypes from '../content-types'
import { createDocumentLink, parseDocumentLink } from '../share-link'

const log = Debug('pushpin:board-title')

export default class BoardTitle extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    openDoc: PropTypes.func.isRequired
  }

  state = { activeOmnibox: false, search: null, selected: -1 }
  input = React.createRef()

  setTitle = ({ title }) => {
    log('onChangeTitle')
    this.handle.change((b) => {
      b.title = title
    })
  }

  // This is the New Boilerplate
  componentWillMount = () => {
    this.refreshHandle(this.props.docId)
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount = () => {
    window.hm.releaseHandle(this.handle)
    document.removeEventListener('keydown', this.onKeyDown)
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshBoardHandle = (boardId) => {
    if (this.boardHandle) {
      window.hm.releaseHandle(this.boardHandle)
    }

    this.boardHandle = window.hm.openHandle(boardId)
    this.boardHandle.onChange((doc) => {
      this.setState({ board: doc })
    })
  }

  onKeyDown = (e) => {
    if (e.metaKey && e.key === '/') {
      this.setState({ activeOmnibox: !this.state.activeOmnibox }, () => {
        if (this.state.activeOmnibox) {
          this.input.current.focus()
        } else {
          this.input.current.blur()
        }
      })
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
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
    this.setState({ activeOmnibox: true })
  }

  deactivateOmnibox = () => {
    this.setState({ activeOmnibox: false })
  }

  handleChange = (e) => {
    this.setState({ search: e.target.value })
  }

  handleCommandKeys = (e) => {
    if (e.key === 'ArrowDown') {
      const selected = this.omniboxControl.moveDown()
      this.setState({ selected })
    }

    if (e.key === 'ArrowUp') {
     const selected = this.omniboxControl.moveUp()
     this.setState({ selected })
    }

    if (e.key === 'Enter') {
      const { selected } = this.state

      if (this.state.selected.type === 'invitation') {
        this.props.openDoc(selected.object.documentUrl)
        this.setState({ activeOmnibox: false }, () => this.input.current.blur())
      }

      if (this.state.selected.type === 'viewedDocUrl') {
        this.props.openDoc(selected.object)
        this.setState({ activeOmnibox: false }, () => this.input.current.blur())
      }
    }
  }

  setOmniboxControl = (controller) => {
    this.omniboxControl = controller
  }

  render = () => {
    log('render')

    return (
      <div className="BoardTitle">
        <Content
          ref={this.omnibox}
          url={createDocumentLink('omnibox', this.props.docId)}
          visible={this.state.activeOmnibox}
          search={this.state.search}
          getKeyController={this.setOmniboxControl}
        />
        <input
          ref={this.input}
          type="text"
          className="TitleBar__titleText"
          value={this.state.board && this.state.board.title || ''}
          onFocus={this.activateOmnibox}
          onBlur={this.deactivateOmnibox}
          onChange={this.handleChange}
          onKeyDown={this.handleCommandKeys}
        />
      </div>
    )
  }
}

ContentTypes.register({
  component: BoardTitle,
  type: 'board-title',
  name: 'Board Title',
  icon: 'sticky-note',
  unlisted: true,
})
