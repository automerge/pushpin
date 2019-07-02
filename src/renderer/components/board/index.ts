import ContentTypes from '../../ContentTypes'

// board in various contexts
import Board, { BOARD_COLORS } from './Board'
import BoardInBoard from './BoardInBoard'
import BoardInList from './BoardInList'
import { HypermergeUrl } from '../../ShareLink'

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
  cards: { [id: string]: BoardDocCard }
  hypermergeUrl: HypermergeUrl // added by workspace
  authorIds: HypermergeUrl[]
}

interface Attrs {
  title?: string
  backgroundColor?: string
}

const BOARD_COLOR_VALUES = Object.values(BOARD_COLORS)

function randomColor(): string {
  return BOARD_COLOR_VALUES[Math.floor(Math.random() * BOARD_COLOR_VALUES.length)]
}

function initializeBoard(
  board: BoardDoc,
  { title = 'No Title', backgroundColor = randomColor() }: Attrs
) {
  board.title = title
  board.backgroundColor = backgroundColor
  board.cards = {}
  board.authorIds = []
}

ContentTypes.register({
  type: 'board',
  contexts: {
    workspace: Board,
    board: BoardInBoard,
    list: BoardInList,
  },
  name: 'Board',
  icon: 'copy',
  initializeDocument: initializeBoard,
})
