import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../content-types'
import { createDocumentLink } from '../share-link'

import Board from './board'

export default class BoardLink extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  // this isn't great
  static initializeDocument(board) {
    Board.initializeDocument(board)
  }

  state = {}

  handleDoubleClick = (e) => {
    e.stopPropagation()
    window.location = createDocumentLink('board', this.props.docId)
  }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => window.hm.releaseHandle(this.handle)
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
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

  render = () => (
    <div className="BoardLink" onDoubleClick={this.handleDoubleClick} style={css.wrapper}>
      <i className="fa fa-files-o" style={{ ...css.icon, background: this.state.backgroundColor }} />
      <div style={css.title}>{ this.state.title }</div>
    </div>
  )
}

const css = {
  icon: {
    fontSize: '60px',
    padding: '18px',
    borderRadius: '48px'
  },
  title: {
    paddingTop: '4px',
    lineHeight: '20px',
    width: '96px',
    textAlign: 'center',
    overflowY: 'hidden',
    textOverflow: 'ellipsis',
  },
  wrapper: {
    flexDirection: 'vertical',
    alignItems: 'center'
  },
}

ContentTypes.register({
  component: BoardLink,
  type: 'board-link',
  name: 'Board',
  icon: 'sticky-note',
  resizable: false,
})
