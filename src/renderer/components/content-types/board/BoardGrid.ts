import { useState, useLayoutEffect } from 'react'

/* Board Grid Utilities
 * (Please be careful before re-using these, they're somewhat idiosyncratic.)
 *
 * The board has a grid, and we treat movement on the grid very carefully.
 *
 * There are two kinds of elements to the grid: positions and dimensions.
 * Positions (composed of coordinates) have an X/Y value, and are generally
 *    snapped to the nearest grid point.
 * Dimensions (composed) of width and height have +1 added to their snap
 * values to ensure that they sit on top of grid lines instead of just within them.
 *
 * It's also important to note that dimensions (width and height) might be "null".
 * Null, as a value, indicates that we should allow the inner content to set width
 * and/or height.
 *
 * */

export const GRID_SIZE = 20

export interface Position {
  x: number
  y: number
}

export interface Dimension {
  width: number
  height: number
}

/* given X/Y coordinates and an index, return the i-th offset.
  this is used by Board.tsx when importing multiple cards so they're 
  not all directly overlapped 
  honestly, this method is a bit stupid and we could do something
  much cuter with proper vector math but, well, let's not right now.
*/
export const gridOffset = ({ x, y }: Position, i: number) => {
  return {
    x: x + i * (GRID_SIZE * 2),
    y: y + i * (GRID_SIZE * 2),
  }
}

// many components have their default size expressed in grid cells
// this is useful if we change grid sizes by a few pixels here or there
// but will probably fall apart if we changed them by large amounts
export const gridCellsToPixels = (i: number): number => {
  return i * GRID_SIZE
}

// Snap given num to nearest multiple of our grid size.
export const snapToGrid = (num) => {
  const resto = num % GRID_SIZE
  if (resto <= GRID_SIZE / 2) {
    return num - resto
  }
  return num + GRID_SIZE - resto
}

// We have slightly different snap functions for coordinates (x,y) and
// measures (height, width) because we want the latter to be a bit larger
// than the grid size to allow overlapping boarders of adjacent elements.
// We also have a special variant of the measure snap that ensures it only
// ever increases the measure, which are needed for some types of content
// (like text which shouldn't get cut off by snapping).

export const snapPositionToGrid = ({ x, y }: Position): Position => ({
  x: snapToGrid(x),
  y: snapToGrid(y),
})

export const snapDimensionToGrid = ({ width, height }: Dimension): Dimension => ({
  // we don't snap falsey-values like null or zero because we don't want them to become 1
  width: width ? snapToGrid(width) + 1 : width,
  height: height ? snapToGrid(height) + 1 : height,
})

/**
 * measure the distance from a start point over time
 */
export function useDistance(): {
  measuring: boolean
  distance: Position
  startMeasure: (Position) => void
  setCurrent: (Position) => void
  endMeasure: () => void
} {
  const [measuring, setMeasuring] = useState<boolean>(false)
  const [start, setStart] = useState<Position>({ x: 0, y: 0 })
  const [current, setCurrent] = useState<Position>({ x: 0, y: 0 })

  const startMeasure = (position) => {
    setMeasuring(true)
    setStart(position)
    setCurrent(position)
  }

  const endMeasure = () => {
    setMeasuring(false)
    setStart(current)
  }

  const [distance, setDistance] = useState<Position>({ x: 0, y: 0 })

  useLayoutEffect(() => {
    setDistance({ x: current.x - start.x, y: current.y - start.y })
  }, [start, current])

  return { measuring, distance, startMeasure, setCurrent, endMeasure }
}
