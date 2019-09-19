import { BoardDoc, CardId, BoardDocCard } from '.'
import { AddCardArgs } from './Board'
import { parseDocumentLink } from '../../../ShareLink'
import ContentTypes from '../../../ContentTypes'
import {
  gridCellsToPixels,
  snapPositionToGrid,
  snapDimensionToGrid,
  Dimension,
  Position,
} from './BoardGrid'
import { boundPosition } from './BoardBoundary'
import { SelectionData } from './BoardSelection'

import uuid = require('uuid')

/*
 * Card manipulation functions
 * all the functions in this section call changeDoc
 */
export const addCardForContent = (b: BoardDoc, { position, dimension, url }: AddCardArgs) => {
  const id = uuid() as CardId // ehhhhh

  const { type } = parseDocumentLink(url)
  const { component = {} } = ContentTypes.lookup({ type, context: 'board' }) as any

  if (!dimension)
    dimension = {
      width: gridCellsToPixels(component.defaultWidth),
      height: gridCellsToPixels(component.defaultHeight),
    }

  const { x, y } = snapPositionToGrid(position)
  const { width, height } = snapDimensionToGrid(dimension)
  const newCard: BoardDocCard = {
    url,
    x,
    y,
  }
  // Automerge doesn't accept undefined values,
  // which we use to indicate content should set its own size on that dimension.
  if (width) {
    newCard.width = width
  }
  if (height) {
    newCard.height = height
  }

  // XXX: this should be keeping the card within the board bounds

  b.cards[id] = newCard

  return id
}

export const moveCardsBy = (b: BoardDoc, selected: CardId[], offset: Position) => {
  selected.forEach((id) => {
    const position = {
      x: b.cards[id].x + offset.x,
      y: b.cards[id].y + offset.y,
    }

    // XXX: this line here is why cards can escape the bounds of the app
    //      we need to do some design around how to handle "floating" dimensions
    //      like width & height so we don't encounter this anymore
    const size = {
      width: b.cards[id].width || 0,
      height: b.cards[id].height || 0,
    }

    const boundedPosition = boundPosition(position, size)
    const newPosition = snapPositionToGrid(boundedPosition)

    // This gets called when uniquely selecting a card, so avoid a document
    // change if in fact the card hasn't moved mod snapping.
    const cardPosition = { x: b.cards[id].x, y: b.cards[id].y }
    if (newPosition.x === cardPosition.x && newPosition.y === cardPosition.y) {
      return
    }

    const card = b.cards[id]
    card.x = newPosition.x
    card.y = newPosition.y
  })
}

export const cardResized = (b: BoardDoc, id: CardId, dimension: Dimension) => {
  // This gets called when uniquely selecting a card, so avoid a document
  // change if in fact the card hasn't moved mod snapping.
  const snapDimension = snapDimensionToGrid(dimension)
  const cardDimension = { width: b.cards[id].width, height: b.cards[id].height }
  if (
    snapDimension.width === cardDimension.width &&
    snapDimension.height === cardDimension.height
  ) {
    return
  }

  const card = b.cards[id]
  card.width = snapDimension.width
  card.height = snapDimension.height
}

export const deleteCards = (b: BoardDoc, ids: CardId[]) => {
  ids.forEach((id) => delete b.cards[id])
}

export const changeBackgroundColor = (b: BoardDoc, color: any) => {
  b.backgroundColor = color.hex
}

interface DeleteCards {
  type: 'DeleteCards'
  selection: SelectionData<CardId>
}
interface MoveCardsBy {
  type: 'MoveCardsBy'
  selection: SelectionData<CardId>
  distance: Position
}
interface AddCardForContent extends AddCardArgs {
  type: 'AddCardForContent'
  selectOnly?: boolean
}

interface ChangeBackgroundColor {
  type: 'ChangeBackgroundColor'
  color: any // this is a weird type from some react component
}

export type BoardDocManipulationAction =
  | DeleteCards
  | MoveCardsBy
  | AddCardForContent
  | ChangeBackgroundColor
