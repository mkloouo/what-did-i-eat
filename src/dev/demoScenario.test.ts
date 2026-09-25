import { buildDemoScenario, DemoEntryPlan } from "./demoScenario";

// A Thursday, early afternoon, local time.
const NOW = new Date(2026, 8, 24, 13, 30);

function entryWithPhoto(plans: DemoEntryPlan[], photoIndex: number) {
  const entry = plans.find((plan) => plan.photoIndexes.includes(photoIndex));
  if (!entry) throw new Error(`no entry holds photo ${photoIndex}`);
  return entry;
}

function daysBefore(date: Date, now: Date): number {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOf(now) - startOf(date)) / 86_400_000);
}

describe("buildDemoScenario", () => {
  it("uses every picked photo exactly once", () => {
    const names = ["cappuccino.jpg", "chili-paneer.jpg", null, "mystery.png"];
    const plans = buildDemoScenario(names, NOW);
    const used = plans.flatMap((plan) => plan.photoIndexes).sort();
    expect(used).toEqual([0, 1, 2, 3]);
  });

  it("gives a known photo its own note, tags and time of day", () => {
    const plans = buildDemoScenario(["cappuccino.jpg"], NOW);
    const entry = entryWithPhoto(plans, 0);
    expect(entry.comment).not.toBe("");
    expect(entry.tagLabels).toContain("Coffee run");
    expect(entry.createdAt.getHours()).toBeGreaterThanOrEqual(9);
    expect(entry.createdAt.getHours()).toBeLessThan(12);
  });

  it("matches file names regardless of case and extension", () => {
    const [entry] = buildDemoScenario(["Cappuccino.JPG"], NOW);
    expect(entry.tagLabels).toContain("Coffee run");
  });

  it("puts photos of the same occasion into one entry", () => {
    const plans = buildDemoScenario(
      ["canape-platter.jpg", "cappuccino.jpg", "charcuterie-board.jpg"],
      NOW,
    );
    expect(entryWithPhoto(plans, 0)).toBe(entryWithPhoto(plans, 2));
    expect(entryWithPhoto(plans, 0).photoIndexes).toEqual([0, 2]);
    expect(plans).toHaveLength(2);
  });

  it("spreads photos of the same meal over different days", () => {
    const plans = buildDemoScenario(["cappuccino.jpg", "latte-art.jpg"], NOW);
    const days = plans.map((plan) => daysBefore(plan.createdAt, NOW));
    expect(new Set(days).size).toBe(2);
  });

  it("never dates an entry after now", () => {
    const plans = buildDemoScenario(
      ["chili-paneer.jpg", "fries-and-chicken.jpg", "cappuccino.jpg"],
      NOW,
    );
    plans.forEach((plan) =>
      expect(plan.createdAt.getTime()).toBeLessThanOrEqual(NOW.getTime()),
    );
    // Breakfast-to-lunch meals still land today when they're already past.
    expect(daysBefore(entryWithPhoto(plans, 2).createdAt, NOW)).toBe(0);
  });

  it("still gives unknown photos a note and a meal time", () => {
    const plans = buildDemoScenario(["IMG_0001.HEIC", null], NOW);
    expect(plans).toHaveLength(2);
    plans.forEach((plan) => expect(plan.comment).not.toBe(""));
  });

  it("returns the same plan for the same input", () => {
    const names = ["cappuccino.jpg", "bubble-tea.jpg", "x.jpg"];
    expect(buildDemoScenario(names, NOW)).toEqual(
      buildDemoScenario(names, NOW),
    );
  });
});
