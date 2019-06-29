import ContentTypes from '../../ContentTypes'

// board in various contexts
import Board, { BOARD_COLORS } from './Board'
import BoardInBoard from './BoardInBoard'
import BoardInList from './BoardInList'

export interface BoardDocCard {
  type: string
  id: string
  url: string
  x: number
  y: number
  height: number
  width: number
}

export interface BoardDoc {
  title: string
  backgroundColor: string
  cards: BoardDocCard[]
}

function initializeBoard(board, { title, backgroundColor }) {
  board.title = title || 'No Title'
  const BOARD_COLOR_VALUES = Object.values(BOARD_COLORS)
  const color = backgroundColor
    || BOARD_COLOR_VALUES[Math.floor(Math.random() * BOARD_COLOR_VALUES.length)]
  board.backgroundColor = color
  board.cards = {}
  board.authorIds = []
}

ContentTypes.register({
  type: 'board',
  contexts: {
    workspace: Board,
    board: BoardInBoard,
    list: BoardInList
  },
  name: 'Board',
  icon: 'copy',
  initializeDocument: initializeBoard
})
