import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { ipcRenderer } from 'electron'

import ContentTypes from '../content-types'
import Content from './content'

// We load these modules here so that the content registry will have them
// and we supppress the eslint warning just for this file here.
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "[A-Z]\w+" }] */
import Board from './board'
import ImageCard from './image-card'
import CodeMirrorEditor from './code-mirror-editor'
import TitleBar from './title-bar'
import BoardTitle from './board-title'
import Toggle from './toggle'
import ContentPreview from './playground'

const log = Debug('pushpin:app')

export default class App extends React.PureComponent {
  static propTypes = {
    state: PropTypes.shape({
      formDocId: PropTypes.string,
      selected: PropTypes.arrayOf(PropTypes.string),
      workspace: PropTypes.object,
      self: PropTypes.object,
      board: PropTypes.object,
    }).isRequired,
    doc: PropTypes.shape({
      boardId: PropTypes.string.isRequired,
      selfId: PropTypes.string.isRequired
    }).isRequired,
    onChange: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)

    this.openBoard = this.openBoard.bind(this)

    ipcRenderer.on('newDocument', () => {
      const docId = Content.initializeContentDoc('board', { selfId: this.props.doc.selfId })
      this.props.onChange(d => { d.boardId = docId })
    })
  }

  openBoard(id) {
    window.hm.open(id).then(doc => {
      this.props.onChange(d => {
        d.boardId = id

        doc.authorIds.forEach(authorId => {
          if (!d.contactIds.includes(authorId)) {
            d.contactIds.push(authorId)
          }
        })
      })
    })
  }

  render() {
    log('render')

    const contentProps = {
      uniquelySelected: false,
      card: {
        type: 'board',
        id: '1',
        height: 800,
        docId: this.props.doc.boardId,
      }
    }

    // Otherwise render the board.
    return (
      <div>
        <Content
          card={{ type: 'title-bar', docId: window.hm.getId(this.props.doc) }}
          state={this.props.state}
          board={this.props.state.board}
          formDocId={this.props.state.formDocId}
          requestedDocId={this.props.state.workspace.boardId}
          self={this.props.state.self}
          onBoardIdChanged={this.openBoard}
        />
        <Content {...contentProps} />
      </div>
    )
  }
}

ContentTypes.register({
  component: App,
  type: 'app',
  name: 'App',
  icon: 'sticky-note',
  unlisted: true,
})
