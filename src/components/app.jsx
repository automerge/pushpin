import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import HashForm from './hash-form'
import Board from './board'

const log = Debug('pushpin:app')

class App extends React.PureComponent {
  render() {
    log('render')

    // Blank while state is initializing.
    if (!this.props.state.board || !this.props.state.board.cards) {
      return <div />
    }

    // Otherwise render the board.
    return (
      <div>
        <HashForm
          formDocId={this.props.state.formDocId}
          activeDocId={this.props.state.activeDocId}
          requestedDocId={this.props.state.requestedDocId}
        />
        <Board
          cards={this.props.state.board.cards}
          selected={this.props.state.selected}
          backgroundColor={this.props.state.board.backgroundColor}
        />
      </div>
    )
  }
}

App.propTypes = {
  state: PropTypes.shape({
    formDocId: PropTypes.string,
    activeDocId: PropTypes.string,
    requestedDocId: PropTypes.string,
    selected: PropTypes.string,
    board: PropTypes.instanceOf(Board),
  }).isRequired
}

export default App
