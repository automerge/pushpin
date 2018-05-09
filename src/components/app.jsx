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
      activeDocId: PropTypes.string,
      requestedDocId: PropTypes.string,
      selected: PropTypes.arrayOf(PropTypes.string),
      board: PropTypes.shape(Board.propTypes).isRequired,
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
          cards={this.props.state.board.cards}
          selected={this.props.state.selected}
          backgroundColor={this.props.state.board.backgroundColor}
        />
        <TitleBar
          title={this.props.state.board.title}
          boardBackgroundColor={this.props.state.board.backgroundColor}
          formDocId={this.props.state.formDocId}
          activeDocId={this.props.state.activeDocId}
          requestedDocId={this.props.state.requestedDocId}
        />
      </div>
    )
  }
}
