// Shared column math for the Days grid: DayGridRow and SlotHeaderRow both
// call computeCellSize with the same window width, so their columns stay
// aligned without either one owning shared layout state.
export const LABEL_WIDTH = 64;
export const GUTTER = 8;
const COLUMN_COUNT = 5;

const MAX_CELL_SIZE = 52;
const MIN_CELL_SIZE = 36;

// A fixed ~52dp cell on all five slot columns overflows narrower phones —
// the row (label + 5 cells + gutters) can run wider than the screen, with
// no horizontal scroll to reach the clipped columns. Cells shrink to
// whatever fits this window's width exactly, capped at the original ~52dp
// so they don't balloon on a wide screen, and floored so they never shrink
// below a still-tappable minimum.
export function computeCellSize(
  windowWidth: number,
  horizontalPadding: number,
): number {
  const available =
    windowWidth -
    2 * horizontalPadding -
    LABEL_WIDTH -
    GUTTER -
    (COLUMN_COUNT - 1) * GUTTER;
  const raw = Math.floor(available / COLUMN_COUNT);
  return Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, raw));
}
