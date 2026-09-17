import { computeGridLayout } from './PhotoGrid';

describe('computeGridLayout', () => {
  it('returns a single full-size cell for 1 photo', () => {
    expect(computeGridLayout(1, 72)).toEqual({ columns: 1, rows: 1, cellSize: 72 });
  });

  it('lays out 2-4 photos as a 2x2 grid', () => {
    expect(computeGridLayout(2, 72)).toEqual({ columns: 2, rows: 1, cellSize: 34 });
    expect(computeGridLayout(3, 72)).toEqual({ columns: 2, rows: 2, cellSize: 34 });
    expect(computeGridLayout(4, 72)).toEqual({ columns: 2, rows: 2, cellSize: 34 });
  });

  it('lays out 5-9 photos as a 3x3 grid', () => {
    expect(computeGridLayout(5, 72)).toEqual({ columns: 3, rows: 2, cellSize: 64 / 3 });
    expect(computeGridLayout(9, 72)).toEqual({ columns: 3, rows: 3, cellSize: 64 / 3 });
  });

  it('lays out 10 photos as a 4-column grid', () => {
    expect(computeGridLayout(10, 72)).toEqual({ columns: 4, rows: 3, cellSize: 15 });
  });

  it('shrinks cell size as photo count grows (non-increasing across boundaries)', () => {
    const sizes = [1, 2, 5, 10, 17].map((count) => computeGridLayout(count, 72).cellSize);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1]);
    }
  });
});
