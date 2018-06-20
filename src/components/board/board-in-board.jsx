import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../../content-types'
import { createDocumentLink } from '../../share-link'

import Board from './board'

export default class BoardInBoard extends React.PureComponent {
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

  render = () => {
    const childCardCount = Object.keys(this.state.cards || {}).length
    return (
      <div
        className="BoardLink"
        onDoubleClick={this.handleDoubleClick}
        style={css.wrapper}
      >
        <i className="fa fa-files-o" style={{ ...css.icon, background: this.state.backgroundColor }} />
        <div style={css.caption}>
          <span style={css.title}>{ this.state.title }</span>
          <br />
          { `${childCardCount} card${childCardCount === 1 ? '' : 's'}` }
        </div>
      </div>
    )
  }
}

const css = {
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    borderRadius: '50%',
    width: 60,
    height: 60,
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.27)',
    flex: 'none'
  },
  caption: {
    marginTop: '1px',
    width: '100%',
    textOverflow: 'ellipsis',
    fontSize: '12px',
    lineHeight: '20px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  title: {
    fontWeight: 'bold'
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
}

ContentTypes.register({
  component: BoardInBoard,
  type: 'board',
  context: 'board',
  name: 'Board',
  icon: 'sticky-note',
  resizable: false,
})
