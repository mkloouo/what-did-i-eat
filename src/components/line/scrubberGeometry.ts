export type ScrubberTick = { dayKey: string; y: number };

// Evenly spaces one tick per day down the rail's height: the first day at
// the very top, the last at the very bottom.
export function buildScrubberTicks(
  dayKeys: string[],
  railHeight: number,
): ScrubberTick[] {
  if (dayKeys.length === 0) return [];
  if (dayKeys.length === 1) return [{ dayKey: dayKeys[0], y: 0 }];
  const step = railHeight / (dayKeys.length - 1);
  return dayKeys.map((dayKey, index) => ({ dayKey, y: index * step }));
}

// The dayKey of whichever tick sits closest to a gesture's y position.
export function nearestDayForY(
  ticks: ScrubberTick[],
  y: number,
): string | null {
  if (ticks.length === 0) return null;
  let closest = ticks[0];
  let closestDistance = Math.abs(ticks[0].y - y);
  for (const tick of ticks.slice(1)) {
    const distance = Math.abs(tick.y - y);
    if (distance < closestDistance) {
      closest = tick;
      closestDistance = distance;
    }
  }
  return closest.dayKey;
}
