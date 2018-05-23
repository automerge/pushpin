import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import TitleBar from './title-bar'
import Board from './board'

const log = Debug('pushpin:app')

export default class App extends React.PureComponent {
  static propTypes = {
    state: PropTypes.shape({
      formDocId: PropTypes.string,
      // activeDocId: PropTypes.string,
      selected: PropTypes.arrayOf(PropTypes.string),
      workspace: PropTypes.object, // TODO: this should probably be better managed
      self: PropTypes.object, // TODO: better validation as well?
      board: PropTypes.shape(Board.propTypes),
    }).isRequired
  }

  render() {
    log('render')

    // Blank while state is initializing.
    if (!this.props.state.board || !this.props.state.board.cards) {
      return <div />
    }

    // Otherwise render the board.
    return (
      <div>
        <Board
          doc={this.props.state.board}
          selected={this.props.state.selected}
        />
        <TitleBar
          // don't do this, this is bad,
          // but this is just to speed up wiring in the share dialogue
          state={this.props.state}
          board={this.props.state.board}
          boardBackgroundColor={this.props.state.board.backgroundColor}
          formDocId={this.props.state.formDocId}
          // activeDocId={this.props.state.activeDocId}
          requestedDocId={this.props.state.workspace.boardId}
          self={this.props.state.self}
        />
      </div>
    )
  }
}
