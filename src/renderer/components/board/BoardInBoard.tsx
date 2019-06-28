import React from 'react'

import { Handle } from 'hypermerge'
import { ContentProps } from '../content'
import { BoardDoc } from '.'
import { createDocumentLink } from '../../ShareLink'

import Board from './Board'

interface State {
  doc?: BoardDoc
}

export default class BoardInBoard extends React.PureComponent<ContentProps, State> {
  // this isn't great
  static initializeDocument(board, typeAttrs) {
    Board.initializeDocument(board, typeAttrs)
  }

  static minWidth = 4
  static minHeight = 6
  static defaultWidth = 6
  static defaultHeight = 6
  static maxWidth = 9
  static maxHeight = 9

  private handle?: Handle<BoardDoc>
  state: State = {}

  handleDoubleClick = (e) => {
    e.stopPropagation()
    window.location.href = createDocumentLink('board', this.props.hypermergeUrl)
  }

  // This is the New Boilerplate
  componentWillMount = () => this.handle = window.repo.watch(
    this.props.hypermergeUrl,
    (doc) => this.onChange(doc)
  )
  componentWillUnmount = () => this.handle && this.handle.close()

  onChange = (doc) => {
    this.setState({ doc })
  }

  render = () => {
    if (!this.state || !this.state.doc) {
      return null
    }
    const { title, backgroundColor, cards } = this.state.doc

    const childCardCount = Object.keys(cards || {}).length
    return (
      <div
        className="BoardLink"
        onDoubleClick={this.handleDoubleClick}
        style={css.wrapper}
      >
        <i className="fa fa-files-o" style={{ ...css.icon, background: backgroundColor }} />
        <div style={css.caption}>
          <span style={css.title}>{title}</span>
          <br />
          {`${childCardCount} card${childCardCount === 1 ? '' : 's'}`}
        </div>
      </div>
    )
  }
}

const css = {
  icon: {
    display: 'flex' as 'flex',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    fontSize: '32px',
    borderRadius: '50%',
    width: 60,
    height: 60,
    flex: 'none' as 'none'
  },
  caption: {
    color: 'var(--colorSecondaryGrey)',
    marginTop: '2px',
    width: '100%',
    textOverflow: 'ellipsis' as 'ellipsis',
    fontSize: '12px',
    lineHeight: '20px',
    textAlign: 'center' as 'center',
    whiteSpace: 'nowrap' as 'nowrap',
    overflow: 'hidden' as 'hidden',
  },
  title: {
    color: 'var(--colorBlueBlack)',
    fontWeight: '600' as 'bold' // errrrrr
  },
  wrapper: {
    boxSizing: 'border-box' as 'border-box',
    border: '1px solid var(--colorPaleGrey)',
    overflow: 'hidden' as 'hidden',
    padding: '10px',
    backgroundColor: 'white',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    width: '100%',
  },
}
