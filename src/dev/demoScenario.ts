import { EntryLocation } from "../types/models";

/**
 * Turns a set of picked sample photos into a few believable days of entries,
 * for App Store screenshots. Photos are recognised by file name (the files in
 * apple-submission/sim-images/); anything else still gets a generic meal.
 * Pure and deterministic: the same names and `now` give the same plan.
 */

export type DemoEntryPlan = {
  createdAt: Date;
  comment: string;
  // Indexes into the file names passed to buildDemoScenario.
  photoIndexes: number[];
  // Matched against the user's tags by label; unknown labels are skipped.
  tagLabels: string[];
  location: EntryLocation | null;
};

type MealKind = "breakfast" | "coffee" | "lunch" | "snack" | "dinner" | "late";

// Base time of day per meal, picked to land in a sensible Days column.
const MEAL_TIMES: Record<MealKind, { hour: number; minute: number }> = {
  breakfast: { hour: 7, minute: 50 },
  coffee: { hour: 10, minute: 20 },
  lunch: { hour: 13, minute: 10 },
  snack: { hour: 15, minute: 40 },
  dinner: { hour: 19, minute: 30 },
  late: { hour: 22, minute: 40 },
};
const MEAL_KINDS = Object.keys(MEAL_TIMES) as MealKind[];

type Occasion = {
  kind: MealKind;
  comment: string;
  tags: string[];
  place?: EntryLocation;
};

const PLACES = {
  hayes: { latitude: 37.7766, longitude: -122.4241, placeName: "Hayes St, San Francisco" },
  valencia: { latitude: 37.7599, longitude: -122.4212, placeName: "Valencia St, San Francisco" },
  clement: { latitude: 37.7827, longitude: -122.464, placeName: "Clement St, San Francisco" },
  market: { latitude: 37.7897, longitude: -122.4, placeName: "Market St, San Francisco" },
} satisfies Record<string, EntryLocation>;

// Photos that belong to one occasion share one entry.
const GROUPS: Record<string, Occasion> = {
  party: {
    kind: "dinner",
    comment: "Anna's birthday spread. Tried a bit of everything",
    tags: ["Dining out"],
    place: PLACES.hayes,
  },
  brunch: {
    kind: "lunch",
    comment: "Hotel brunch, went back twice",
    tags: ["Dining out"],
    place: PLACES.market,
  },
};

const PHOTOS: Record<string, Occasion | { group: keyof typeof GROUPS }> = {
  cappuccino: { kind: "coffee", comment: "Cappuccino before standup", tags: ["Coffee run"] },
  "latte-art": {
    kind: "coffee",
    comment: "Flat white from the place on the corner",
    tags: ["Coffee run", "On the go"],
    place: PLACES.hayes,
  },
  "milk-tea-and-biscuit": {
    kind: "breakfast",
    comment: "Milk tea and one (1) biscuit, slow start",
    tags: ["Home cooked"],
  },
  "fruit-basket": {
    kind: "breakfast",
    comment: "Oranges from the market, ate two on the way out",
    tags: ["Plant-rich", "On the go"],
  },
  "savory-pancake-stack": {
    kind: "breakfast",
    comment: "Spinach pancakes, made too many again",
    tags: ["Home cooked", "Plant-rich"],
  },
  "masala-chai": { kind: "snack", comment: "Chai and crackers, 4 pm slump", tags: ["Quick bite"] },
  "bubble-tea": {
    kind: "snack",
    comment: "Brown sugar boba, no regrets",
    tags: ["Sweet treat", "On the go"],
    place: PLACES.clement,
  },
  "fritters-with-dip": {
    kind: "snack",
    comment: "Fritters with garlic dip, shared (mostly not)",
    tags: ["Quick bite"],
  },
  "chili-paneer": {
    kind: "dinner",
    comment: "Chili paneer, way spicier than planned",
    tags: ["Home cooked"],
  },
  "spinach-on-banana-leaf": {
    kind: "dinner",
    comment: "Palak on a banana leaf. Want to go back already",
    tags: ["Dining out", "Plant-rich"],
    place: PLACES.valencia,
  },
  "biryani-platter": { kind: "dinner", comment: "Biryani night with cutlets", tags: ["Takeout"] },
  "fries-and-chicken": {
    kind: "late",
    comment: "Fries after the movie. Worth it",
    tags: ["Takeout", "Late night snack"],
  },
  "charcuterie-board": { group: "party" },
  "canape-platter": { group: "party" },
  "party-snacks": { group: "party" },
  "brunch-buffet": { group: "brunch" },
  "buffet-plate": { group: "brunch" },
};

const FALLBACK_KINDS: MealKind[] = ["lunch", "dinner", "breakfast", "snack"];
const FALLBACK_COMMENTS = [
  "Leftovers, still good",
  "Something quick between calls",
  "Tried a new place",
  "Late lunch at my desk",
];

function photoKey(fileName: string | null): string {
  return (fileName ?? "").toLowerCase().replace(/\.[a-z0-9]+$/, "");
}

type Draft = { occasion: Occasion; photoIndexes: number[] };

function draftsFor(fileNames: Array<string | null>): Draft[] {
  const drafts: Draft[] = [];
  const groupDrafts = new Map<string, Draft>();
  let unknownCount = 0;

  fileNames.forEach((fileName, index) => {
    const known = PHOTOS[photoKey(fileName)];
    if (known && "group" in known) {
      const existing = groupDrafts.get(known.group);
      if (existing) {
        existing.photoIndexes.push(index);
        return;
      }
      const draft = { occasion: GROUPS[known.group], photoIndexes: [index] };
      groupDrafts.set(known.group, draft);
      drafts.push(draft);
      return;
    }
    const occasion = known ?? {
      kind: FALLBACK_KINDS[unknownCount % FALLBACK_KINDS.length],
      comment: FALLBACK_COMMENTS[unknownCount % FALLBACK_COMMENTS.length],
      tags: [],
    };
    if (!known) unknownCount++;
    drafts.push({ occasion, photoIndexes: [index] });
  });

  return drafts;
}

function mealDate(now: Date, kind: MealKind, daysBack: number): Date {
  const { hour, minute } = MEAL_TIMES[kind];
  // Nudge times a little so meals don't all sit on the same minute.
  const jitter = ((daysBack * 17 + MEAL_KINDS.indexOf(kind) * 11) % 25) - 12;
  const date = new Date(now);
  date.setDate(date.getDate() - daysBack);
  date.setHours(hour, minute + jitter, 0, 0);
  return date;
}

export function buildDemoScenario(
  fileNames: Array<string | null>,
  now: Date,
): DemoEntryPlan[] {
  // Each meal kind fills one day at a time, going back from today; a meal
  // whose time today hasn't come yet starts yesterday instead.
  const nextDayByKind = new Map<MealKind, number>();

  return draftsFor(fileNames).map(({ occasion, photoIndexes }) => {
    let daysBack = nextDayByKind.get(occasion.kind) ?? 0;
    let createdAt = mealDate(now, occasion.kind, daysBack);
    while (createdAt.getTime() > now.getTime()) {
      daysBack++;
      createdAt = mealDate(now, occasion.kind, daysBack);
    }
    nextDayByKind.set(occasion.kind, daysBack + 1);

    return {
      createdAt,
      comment: occasion.comment,
      photoIndexes,
      tagLabels: occasion.tags,
      location: occasion.place ?? null,
    };
  });
}
