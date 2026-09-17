import { isValidTagLabel } from './tagLabel';

describe('isValidTagLabel', () => {
  it('rejects an empty label', () => {
    expect(isValidTagLabel('')).toBe(false);
  });

  it('rejects a whitespace-only label', () => {
    expect(isValidTagLabel('   ')).toBe(false);
  });

  it('accepts a single word', () => {
    expect(isValidTagLabel('Home')).toBe(true);
  });

  it('accepts up to three words', () => {
    expect(isValidTagLabel('Home cooked meal')).toBe(true);
  });

  it('rejects more than three words', () => {
    expect(isValidTagLabel('Home cooked meal today')).toBe(false);
  });
});
