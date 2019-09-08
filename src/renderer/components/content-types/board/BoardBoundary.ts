/* The board prevents cards from getting outside itself, which is a little tricky.
 */

import { BOARD_HEIGHT, BOARD_WIDTH } from './Board'
import { Dimension, Position } from './BoardGrid'

export const boundPosition = (
  { x, y }: Position,
  { width = 0, height = 0 }: Dimension
): Position => ({
  x: Math.min(Math.max(x, 0), BOARD_WIDTH - width),
  y: Math.min(Math.max(y, 0), BOARD_HEIGHT - height),
})
