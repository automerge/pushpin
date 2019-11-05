/* The board prevents cards from getting outside itself, which is a little tricky.
 */

import { BOARD_HEIGHT, BOARD_WIDTH } from './Board'
import { Dimension, Position, gridCellsToPixels } from './BoardGrid'
import { PushpinUrl, parseDocumentLink } from '../../../ShareLink'
import * as ContentTypes from '../../../ContentTypes'

export const boundPosition = (
  { x, y }: Position,
  { width = 0, height = 0 }: Dimension
): Position => ({
  x: Math.min(Math.max(x, 0), BOARD_WIDTH - width),
  y: Math.min(Math.max(y, 0), BOARD_HEIGHT - height),
})

export const boundDimension = (
  { x, y }: Position,
  { width = 0, height = 0 }: Dimension
): Dimension => ({
  width: Math.min(width, BOARD_WIDTH - x),
  height: Math.min(height, BOARD_HEIGHT - y),
})

const CARD_MIN_WIDTH = 4
const CARD_MIN_HEIGHT = 2
const CARD_MAX_WIDTH = 72
const CARD_MAX_HEIGHT = 72

export const boundSizeByType = (
  url: PushpinUrl,
  { width = 0, height = 0 }: Dimension
): Dimension => {
  const { type } = parseDocumentLink(url)
  const { component = {} } = ContentTypes.lookup({ type, context: 'board' }) || {}
  const {
    minWidth = CARD_MIN_WIDTH,
    minHeight = CARD_MIN_HEIGHT,
    maxWidth = CARD_MAX_WIDTH,
    maxHeight = CARD_MAX_HEIGHT,
  } = component as any // when we care, we set this as properties on components

  // this undefined values option for dimensions is super annoying
  const bounds = {
    min: {
      width: gridCellsToPixels(minWidth) || 0,
      height: gridCellsToPixels(minHeight) || 0,
    },
    max: {
      width: gridCellsToPixels(maxWidth) || 0,
      height: gridCellsToPixels(maxHeight) || 0,
    },
  }

  return {
    width: Math.min(bounds.max.width, Math.max(bounds.min.width, width)),
    height: Math.min(bounds.max.height, Math.max(bounds.min.height, height)),
  }
}
