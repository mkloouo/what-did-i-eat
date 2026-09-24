// How many columns (and rows) the density mosaic subdivides into for a
// given photo count — texture, not a number the user reads. Matches the
// spec's table: 0 empty, 1 full tile, 2-4 a 2x2, 5-9 a 3x3, 10+ a
// 4x4 capped at 16 photos (sampleSpread below picks which 16).
export function densityColumns(photoCount: number): number {
  if (photoCount <= 0) return 0;
  if (photoCount === 1) return 1;
  if (photoCount <= 4) return 2;
  if (photoCount <= 9) return 3;
  return 4;
}

// Picks `max` items spread across `items`, always keeping the first and
// last, so a capped mosaic reads as representative of the whole burst
// instead of just its opening seconds.
export function sampleSpread<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  if (max <= 1) return items.slice(0, max);

  const result: T[] = [];
  for (let i = 0; i < max; i++) {
    const index = Math.round((i * (items.length - 1)) / (max - 1));
    result.push(items[index]);
  }
  return result;
}
