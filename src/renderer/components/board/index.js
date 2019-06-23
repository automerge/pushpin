import ContentTypes from '../../content-types'

// board in various contexts
import Board from './board'
import BoardInBoard from './board-in-board'
import BoardInList from './board-in-list'


ContentTypes.register({
  type: 'board',
  contexts: {
    workspace: Board,
    board: BoardInBoard,
    list: BoardInList },
  name: 'Board',
  icon: 'copy',
})
