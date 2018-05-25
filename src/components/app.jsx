import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import * as BoardModel from '../models/board'
import Loop from '../loop'
import ContentTypes from '../content-types'

import Content from './content'
import Board from './board'
import ImageCard from './image-card'
import CodeMirrorEditor from './code-mirror-editor'
import TitleBar from './title-bar'
import BoardTitle from './board-title'

const log = Debug('pushpin:app')

export default class App extends React.PureComponent {
  static propTypes = {
    state: PropTypes.shape({
      formDocId: PropTypes.string,
      // activeDocId: PropTypes.string,
      selected: PropTypes.arrayOf(PropTypes.string),
      workspace: PropTypes.object, // TODO: this should probably be better managed
      self: PropTypes.object // TODO: better validation as well?
      // board: PropTypes.shape(Board.propTypes),
    }).isRequired
  }

  constructor(props) {
    super(props)
    this.state = { boardId: this.props.state.workspace.boardId }
    this.updateBoardId = this.updateBoardId.bind(this)
  }

  updateBoardId(id) {
    this.setState({ boardId: id })
  }

  render() {
    log('render')

    const contentProps = {
      uniquelySelected: false,
      card: {
        type: 'board',
        id: '1',
        height: 800,
        docId: this.state.boardId,
      }
    }

    // Otherwise render the board.
    return <div>
      <Content
        card={{type: 'title-bar',type: 'title-bar', docId: window.hm.getId(this.props.state.workspace)}}
        state={this.props.state}
        board={this.props.state.board}
        formDocId={this.props.state.formDocId}
        requestedDocId={this.props.state.workspace.boardId}
        self={this.props.state.self}
        onBoardIdChanged={this.updateBoardId}
      />
      <Content {...contentProps} />
    </div>
  }
}

ContentTypes.register({
  component: App,
  type: 'app',
  name: 'App',
  icon: 'sticky-note'
})
