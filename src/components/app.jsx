import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import TitleBar from './title-bar'
import * as BoardModel from '../models/board'
import Loop from '../loop'
import Content from './content'

import Board from './board'
import ImageCard from './image-card'
import CodeMirrorEditor from './code-mirror-editor'

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

  render() {
    log('render')

    // Blank while state is initializing.
    if (!this.props.state.board) {
      return <div />
    }

    const contentProps = {
      uniquelySelected: false,
      card: {
        type: 'board',
        id: '1',
        height: 800,
        docId: window.hm.getId(this.props.state.board),
      }
    }

    // Otherwise render the board.
    return <Content {...contentProps} />
  }
}
