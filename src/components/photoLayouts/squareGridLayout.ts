import { PhotoLayoutResult, Rect } from "./types";

// A fixed-width grid of equal squares, filled left to right, top to bottom,
// wrapping to a new row every `columns` photos. `PhotoStack`'s tileInsets/
// tileCornerRadius already turn touching unit-space rects into flush edges
// with an exact-pixel seam between them, so this only needs to place each
// photo in its cell — no gap is baked into the unit space itself.
export function squareGridLayout(
  photosByEntry: string[][],
  columns: number,
): PhotoLayoutResult {
  const photoCount = photosByEntry.reduce(
    (count, photos) => count + photos.length,
    0,
  );
  const rects: Rect[] = [];

  for (let i = 0; i < photoCount; i++) {
    rects.push({
      x: i % columns,
      y: Math.floor(i / columns),
      width: 1,
      height: 1,
    });
  }

  return {
    rects,
    unitWidth: columns,
    unitHeight: Math.ceil(photoCount / columns),
  };
}
