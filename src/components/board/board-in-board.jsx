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

  static minWidth = 4
  static minHeight = 6
  static defaultWidth = 6
  static defaultHeight = 6
  static maxWidth = 9
  static maxHeight = 9

  state = {}

  handleDoubleClick = (e) => {
    e.stopPropagation()
    window.location = createDocumentLink('board', this.props.docId)
  }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => this.handle.close()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(docId, (doc) => this.onChange(doc))
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
    flex: 'none'
  },
  caption: {
    color: 'var(--colorSecondaryGrey)',
    marginTop: '2px',
    width: '100%',
    textOverflow: 'ellipsis',
    fontSize: '12px',
    lineHeight: '20px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  title: {
    color: 'var(--colorBlueBlack)',
    fontWeight: '600'
  },
  wrapper: {
    boxSizing: 'border-box',
    border: '1px solid var(--colorPaleGrey)',
    overflow: 'hidden',
    padding: '10px',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
}

ContentTypes.register({
  component: BoardInBoard,
  type: 'board',
  context: 'board',
  name: 'Board',
  icon: 'sticky-note',
  resizable: true,
})
