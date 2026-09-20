import { buildDayMarks } from "./dayMarks";
import { DaySection } from "../../store/selectors/groupSelectors";

function section(groups: DaySection["groups"]): DaySection {
  return { dayKey: "2026-03-05", groups };
}

describe("buildDayMarks", () => {
  it("gives one mark per photo, positioned by its entry's time of day", () => {
    const marks = buildDayMarks(
      section([
        {
          id: "g1",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            {
              id: "e1",
              createdAt: new Date(2026, 2, 5, 12, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p1", uri: "a.jpg" }],
            },
          ],
          photosByEntry: [["a.jpg"]],
        },
      ]),
    );

    expect(marks).toEqual([{ uri: "a.jpg", x: 0.5, stack: 0 }]);
  });

  it("stacks every mark in a group instead of overlapping them", () => {
    const marks = buildDayMarks(
      section([
        {
          id: "g1",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            {
              id: "e1",
              createdAt: new Date(2026, 2, 5, 8, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [
                { id: "p1", uri: "a.jpg" },
                { id: "p2", uri: "b.jpg" },
              ],
            },
            {
              id: "e2",
              createdAt: new Date(2026, 2, 5, 8, 5, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p3", uri: "c.jpg" }],
            },
          ],
          photosByEntry: [["a.jpg", "b.jpg"], ["c.jpg"]],
        },
      ]),
    );

    expect(marks.map((m) => m.stack)).toEqual([0, 1, 2]);
    expect(marks.map((m) => m.uri)).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("resets the stack for each new group", () => {
    const marks = buildDayMarks(
      section([
        {
          id: "g1",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            {
              id: "e1",
              createdAt: new Date(2026, 2, 5, 8, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p1", uri: "a.jpg" }],
            },
          ],
          photosByEntry: [["a.jpg"]],
        },
        {
          id: "g2",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            {
              id: "e2",
              createdAt: new Date(2026, 2, 5, 19, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p2", uri: "b.jpg" }],
            },
          ],
          photosByEntry: [["b.jpg"]],
        },
      ]),
    );

    expect(marks.map((m) => m.stack)).toEqual([0, 0]);
  });

  it("produces no marks for a day with no groups", () => {
    expect(buildDayMarks(section([]))).toEqual([]);
  });

  it("does not stack marks that are hours apart, even inside one group", () => {
    const marks = buildDayMarks(
      section([
        {
          id: "g1",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            {
              id: "e1",
              createdAt: new Date(2026, 2, 5, 8, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p1", uri: "a.jpg" }],
            },
            {
              id: "e2",
              createdAt: new Date(2026, 2, 5, 20, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p2", uri: "b.jpg" }],
            },
          ],
          photosByEntry: [["a.jpg"], ["b.jpg"]],
        },
      ]),
    );

    expect(marks.map((m) => m.stack)).toEqual([0, 0]);
  });

  it("reuses a lower row once a later mark has cleared the earlier ones", () => {
    const at = (h: number, m: number) =>
      new Date(2026, 2, 5, h, m, 0).toISOString();
    const marks = buildDayMarks(
      section([
        {
          id: "g1",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            { id: "e1", createdAt: at(8, 0), comment: "", location: null, photos: [{ id: "p1", uri: "a.jpg" }] },
            { id: "e2", createdAt: at(8, 10), comment: "", location: null, photos: [{ id: "p2", uri: "b.jpg" }] },
            { id: "e3", createdAt: at(15, 0), comment: "", location: null, photos: [{ id: "p3", uri: "c.jpg" }] },
          ],
          photosByEntry: [["a.jpg"], ["b.jpg"], ["c.jpg"]],
        },
      ]),
    );

    expect(marks.map((m) => m.stack)).toEqual([0, 1, 0]);
  });
});
