/**
 * Counts consecutive taps: returns true on the tap that completes `required`
 * taps with no gap longer than `maxGapMs`, then starts over.
 */
export function createTapCounter(
  required: number,
  maxGapMs: number,
): (nowMs: number) => boolean {
  let count = 0;
  let lastTapMs = -Infinity;

  return (nowMs) => {
    count = nowMs - lastTapMs > maxGapMs ? 1 : count + 1;
    lastTapMs = nowMs;
    if (count < required) return false;
    count = 0;
    lastTapMs = -Infinity;
    return true;
  };
}
