// Shared column math for the Days grid: DayGridRow and SlotHeaderRow both
// call computeCellSize with the same window width, so their columns stay
// aligned without either one owning shared layout state.
export const LABEL_WIDTH = 64;
export const GUTTER = 8;
const COLUMN_COUNT = 5;

const MIN_CELL_SIZE = 36;

// Cells size themselves to fill this window's width exactly: a fixed ~52dp
// cell overflowed narrower phones (no horizontal scroll to reach clipped
// columns) and left most of an iPad's width empty. Floored so they never
// shrink below a still-tappable minimum.
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
  return Math.max(MIN_CELL_SIZE, raw);
}
