import React from 'react'
import Debug from 'debug'

import HashForm from './hash-form'
import Board from './board'

const log = Debug('pushpin:app')

class App extends React.PureComponent {
  render() {
    log('render')

    // Blank while state is initializing.
    if (!this.props.state.board || !this.props.state.board.cards) {
      return <div></div>
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
        />
      </div>
    )
  }
}

export default App
