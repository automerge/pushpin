/* Board Grid Utilities
 * (Please be careful before re-using these, they're somewhat idiosyncratic.)
 *
 * The board has a grid, and we treat movement on the grid very carefully.
 *
 * There are two kinds of elements to the grid: positions and dimensions.
 * Positions (composed of coordinates) have an X/Y value, and are generally
 *    snapped to the nearest grid point.
 * Dimensions (composed) of width and height, are never rounded down, in order
 * to avoid squashing their contents. Dimensions also have +1 added to their snap
 * values to ensure that they sit on top of grid lines instead of just within them.
 *
 * It's also important to note that dimensions (width and height) might be "null".
 * Null, as a value, indicates that we should allow the inner content to set width
 * and/or height.
 *
 * */

const GRID_SIZE = 20

export interface Position {
  x: number
  y: number
}

// we support null dimensions to indicate "free"
type Measure = number | Undimensioned
type Undimensioned = null
export interface Dimension {
  width: Measure
  height: Measure
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
export const gridCellsToPixels = (i): Measure => {
  // there's a smell here that we're checking truthiness of i and returning null
  // but that's how the calling code expects it to work, so i'm leaving it thus for now
  // if you're chasing a weird bug and found yourself here... hope this helps.
  if (!i) {
    return null
  }
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

export const snapCoordinateToGrid = (coordinate) => snapToGrid(coordinate)
export const snapMeasureToGrid = (measure: Measure): Measure => measure && snapToGrid(measure) + 1

export const snapPositionToGrid = ({ x, y }: Position): Position => ({
  x: snapCoordinateToGrid(x),
  y: snapCoordinateToGrid(y),
})

// TODO: i'm probably handling "null" values incorrectly here somewhere
export const snapDimensionToGrid = (
  { width, height }: Dimension = { width: null, height: null }
): Dimension => ({
  width: snapMeasureToGrid(width),
  height: snapMeasureToGrid(height),
})

export const snapMeasureOutwardToGrid = (measure) => {
  const snapped = snapMeasureToGrid(measure)
  if (!snapped) {
    // yikes... this is crazy logic. need to rethink the nulls
    return snapped
  }
  if (snapped >= measure) {
    return snapped
  }
  return snapped + GRID_SIZE
}
