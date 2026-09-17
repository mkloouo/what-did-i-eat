import { PhotoLayoutResult, Rect } from './types';

const UNIT_SIZE = 1000;
const ENTRY_FIRST_WEIGHT = 3;
const OTHER_WEIGHT = 1;

export function squarifiedLayout(photosByEntry: string[][]): PhotoLayoutResult {
  const weights = photosByEntry.flatMap((entryPhotos) =>
    entryPhotos.map((_, photoIndex) => (photoIndex === 0 ? ENTRY_FIRST_WEIGHT : OTHER_WEIGHT))
  );

  const rects =
    weights.length === 0
      ? []
      : squarify(weights, { x: 0, y: 0, width: UNIT_SIZE, height: UNIT_SIZE });

  return { rects, unitWidth: UNIT_SIZE, unitHeight: UNIT_SIZE };
}

function squarify(weights: number[], rect: Rect): Rect[] {
  const total = weights.reduce((sum, w) => sum + w, 0);
  const areas = weights.map((w) => (w / total) * rect.width * rect.height);
  const out: Rect[] = new Array(areas.length);

  let remaining = rect;
  let row: number[] = [];

  for (let i = 0; i < areas.length; i++) {
    const shortSide = Math.min(remaining.width, remaining.height);
    const candidateRow = [...row, i];

    if (row.length === 0 || worstRatio(row, areas, shortSide) >= worstRatio(candidateRow, areas, shortSide)) {
      row = candidateRow;
    } else {
      remaining = placeRow(row, areas, remaining, out);
      row = [i];
    }
  }
  if (row.length > 0) {
    placeRow(row, areas, remaining, out);
  }

  return out;
}

function worstRatio(row: number[], areas: number[], shortSide: number): number {
  const sum = row.reduce((s, i) => s + areas[i], 0);
  const max = Math.max(...row.map((i) => areas[i]));
  const min = Math.min(...row.map((i) => areas[i]));
  return Math.max((shortSide * shortSide * max) / (sum * sum), (sum * sum) / (shortSide * shortSide * min));
}

function placeRow(row: number[], areas: number[], rect: Rect, out: Rect[]): Rect {
  const sum = row.reduce((s, i) => s + areas[i], 0);

  if (rect.width <= rect.height) {
    const rowHeight = sum / rect.width;
    let x = rect.x;
    for (const i of row) {
      const width = areas[i] / rowHeight;
      out[i] = { x, y: rect.y, width, height: rowHeight };
      x += width;
    }
    return { x: rect.x, y: rect.y + rowHeight, width: rect.width, height: rect.height - rowHeight };
  }

  const columnWidth = sum / rect.height;
  let y = rect.y;
  for (const i of row) {
    const height = areas[i] / columnWidth;
    out[i] = { x: rect.x, y, width: columnWidth, height };
    y += height;
  }
  return { x: rect.x + columnWidth, y: rect.y, width: rect.width - columnWidth, height: rect.height };
}
