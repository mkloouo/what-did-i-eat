import { computeWindowTitle } from './windowTitle';

function iso(hour: number, minute = 0): string {
  return new Date(2026, 2, 5, hour, minute, 0).toISOString();
}

describe('computeWindowTitle', () => {
  it('returns each bucket\'s base title for a single long-ish entry outside quick-bite range', () => {
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(6), timeToIso: iso(6, 30) })
    ).toBe('Early Morning Awakening');
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(9), timeToIso: iso(9, 30) })
    ).toBe('Morning Breakfast');
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(12), timeToIso: iso(12, 30) })
    ).toBe('Midday Lunch');
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(15), timeToIso: iso(15, 30) })
    ).toBe('Afternoon Bite & Coffee');
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(17), timeToIso: iso(17, 30) })
    ).toBe('Late Afternoon Grazing');
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(19), timeToIso: iso(19, 30) })
    ).toBe('Evening Dinner');
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(22), timeToIso: iso(22, 30) })
    ).toBe('Late Evening Nibble');
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(2), timeToIso: iso(2, 30) })
    ).toBe('Night Owl Kitchen');
  });

  it('returns "{period} Quick Bite" for a single entry, regardless of duration', () => {
    expect(
      computeWindowTitle({ entryCount: 1, timeFromIso: iso(12), timeToIso: iso(12) })
    ).toBe('Midday Quick Bite');
  });

  it('returns "{period} Quick Bite" for a multi-entry group with a short span', () => {
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(19), timeToIso: iso(19, 10) })
    ).toBe('Evening Quick Bite');
  });

  it('returns the Leisurely Grazing Window for a long span with 3+ entries', () => {
    expect(
      computeWindowTitle({ entryCount: 3, timeFromIso: iso(12), timeToIso: iso(13, 30) })
    ).toBe('Leisurely Grazing Window');
  });

  it('returns "{startNoun} & {endPeriod} Bites" for a long span with exactly 2 entries', () => {
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(12), timeToIso: iso(15) })
    ).toBe('Lunch & Afternoon Bites');
  });

  it('handles a boundary case exactly at a bucket edge (start is inclusive)', () => {
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(8, 30), timeToIso: iso(9) })
    ).toBe('Morning Breakfast');
  });

  it('wraps the last bucket past midnight', () => {
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(23), timeToIso: iso(23, 30) })
    ).toBe('Late Evening Nibble');
    expect(
      computeWindowTitle({ entryCount: 2, timeFromIso: iso(0), timeToIso: iso(0, 30) })
    ).toBe('Night Owl Kitchen');
  });
});
