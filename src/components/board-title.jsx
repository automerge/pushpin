import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { RIEInput } from 'riek'

import Content from './content'
import ContentTypes from '../content-types'
import { createDocumentLink } from '../share-link'

const log = Debug('pushpin:board-title')

export default class BoardTitle extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
  }

  state = { activeOmnibox: false, search: null, move: null }
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
    this.setState({ ...doc })
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

  handleArrowKeys = (e) => {
    if (e.key === 'ArrowDown') {
      this.omniboxControl.moveDown()
    }

    if (e.key === 'ArrowUp') {
      this.omniboxControl.moveUp()
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
          value={this.state.title || ''}
          onFocus={this.activateOmnibox}
          onBlur={this.deactivateOmnibox}
          onChange={this.handleChange}
          onKeyDown={this.handleArrowKeys}
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
