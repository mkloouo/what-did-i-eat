import { PhotoLayoutResult, Rect } from "./types";

const UNIT_WIDTH = 1000;
const COLUMNS = 2;
export const GAP = 12;
export const COLUMN_WIDTH = (UNIT_WIDTH - GAP * (COLUMNS - 1)) / COLUMNS;
export const SUB_TILE_SIZE = (COLUMN_WIDTH - GAP) / 2;

export function masonryLayout(photosByEntry: string[][]): PhotoLayoutResult {
  const columnHeights = new Array(COLUMNS).fill(0);
  const rects: Rect[] = [];

  for (const entryPhotos of photosByEntry) {
    if (entryPhotos.length === 0) continue;

    const column = columnHeights[0] <= columnHeights[1] ? 0 : 1;
    const columnX = column * (COLUMN_WIDTH + GAP);
    let y = columnHeights[column];

    rects.push({ x: columnX, y, width: COLUMN_WIDTH, height: COLUMN_WIDTH });
    y += COLUMN_WIDTH + GAP;

    const extraPhotos = entryPhotos.slice(1);
    for (let i = 0; i < extraPhotos.length; i += 2) {
      const rowCount = Math.min(2, extraPhotos.length - i);
      for (let j = 0; j < rowCount; j++) {
        rects.push({
          x: columnX + j * (SUB_TILE_SIZE + GAP),
          y,
          width: SUB_TILE_SIZE,
          height: SUB_TILE_SIZE,
        });
      }
      y += SUB_TILE_SIZE + GAP;
    }

    columnHeights[column] = y - GAP;
  }

  return {
    rects,
    unitWidth: UNIT_WIDTH,
    unitHeight: Math.max(0, ...columnHeights),
  };
}
