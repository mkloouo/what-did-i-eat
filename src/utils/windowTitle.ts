export type WindowTitleInput = {
  entryCount: number;
  timeFromIso: string; // chronologically earliest entry's createdAt
  timeToIso: string; // chronologically latest entry's createdAt
};

type Bucket = {
  startMinutes: number;
  endMinutes: number;
  periodLabel: string;
  mealNoun: string;
  baseTitle: string;
};

const BUCKETS: Bucket[] = [
  {
    startMinutes: 5 * 60,
    endMinutes: 8 * 60 + 30,
    periodLabel: "Early Morning",
    mealNoun: "Awakening",
    baseTitle: "Early Morning Awakening",
  },
  {
    startMinutes: 8 * 60 + 30,
    endMinutes: 11 * 60 + 30,
    periodLabel: "Morning",
    mealNoun: "Breakfast",
    baseTitle: "Morning Breakfast",
  },
  {
    startMinutes: 11 * 60 + 30,
    endMinutes: 14 * 60,
    periodLabel: "Midday",
    mealNoun: "Lunch",
    baseTitle: "Midday Lunch",
  },
  {
    startMinutes: 14 * 60,
    endMinutes: 16 * 60 + 30,
    periodLabel: "Afternoon",
    mealNoun: "Coffee",
    baseTitle: "Afternoon Bite & Coffee",
  },
  {
    startMinutes: 16 * 60 + 30,
    endMinutes: 18 * 60 + 30,
    periodLabel: "Late Afternoon",
    mealNoun: "Grazing",
    baseTitle: "Late Afternoon Grazing",
  },
  {
    startMinutes: 18 * 60 + 30,
    endMinutes: 21 * 60 + 30,
    periodLabel: "Evening",
    mealNoun: "Dinner",
    baseTitle: "Evening Dinner",
  },
  {
    startMinutes: 21 * 60 + 30,
    endMinutes: 24 * 60,
    periodLabel: "Late Evening",
    mealNoun: "Nibble",
    baseTitle: "Late Evening Nibble",
  },
  {
    startMinutes: 0,
    endMinutes: 5 * 60,
    periodLabel: "Night",
    mealNoun: "Kitchen",
    baseTitle: "Night Owl Kitchen",
  },
];

function bucketFor(iso: string): Bucket {
  const d = new Date(iso);
  const minutes = d.getHours() * 60 + d.getMinutes();
  const bucket = BUCKETS.find((b) =>
    b.startMinutes < b.endMinutes
      ? minutes >= b.startMinutes && minutes < b.endMinutes
      : minutes >= b.startMinutes || minutes < b.endMinutes,
  );
  // The buckets above tile [0, MINUTES_IN_DAY) exactly, so this is unreachable.
  return bucket ?? BUCKETS[BUCKETS.length - 1];
}

export function computeWindowTitle(input: WindowTitleInput): string {
  const { entryCount, timeFromIso, timeToIso } = input;
  const durationMs =
    new Date(timeToIso).getTime() - new Date(timeFromIso).getTime();
  const startBucket = bucketFor(timeFromIso);

  if (entryCount === 1 || durationMs <= 15 * 60_000) {
    return `${startBucket.periodLabel} Quick Bite`;
  }

  if (durationMs >= 75 * 60_000 && entryCount >= 3) {
    return "Leisurely Grazing Window";
  }

  if (durationMs >= 75 * 60_000 && entryCount === 2) {
    const endBucket = bucketFor(timeToIso);
    return `${startBucket.mealNoun} & ${endBucket.periodLabel} Bites`;
  }

  return startBucket.baseTitle;
}
