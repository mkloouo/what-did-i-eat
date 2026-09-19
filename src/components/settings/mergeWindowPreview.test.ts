import { previewGroups } from "./mergeWindowPreview";
import { Entry } from "../../types/models";

function entry(id: string, iso: string): Entry {
  return { id, createdAt: iso, comment: "", location: null, photos: [] };
}

describe("previewGroups", () => {
  it("returns no groups for no entries", () => {
    expect(previewGroups([], 60)).toEqual([]);
  });

  it("puts entries closer together than the window in one group", () => {
    const a = entry("a", new Date(2026, 2, 5, 12, 0, 0).toISOString());
    const b = entry("b", new Date(2026, 2, 5, 12, 10, 0).toISOString());
    const groups = previewGroups([a, b], 60);
    expect(groups).toEqual([[a, b]]);
  });

  it("splits entries further apart than the window into separate groups", () => {
    const a = entry("a", new Date(2026, 2, 5, 8, 0, 0).toISOString());
    const b = entry("b", new Date(2026, 2, 5, 12, 0, 0).toISOString());
    const groups = previewGroups([a, b], 60);
    expect(groups).toEqual([[a], [b]]);
  });

  it("chains three close-together entries into one group", () => {
    const a = entry("a", new Date(2026, 2, 5, 8, 0, 0).toISOString());
    const b = entry("b", new Date(2026, 2, 5, 8, 20, 0).toISOString());
    const c = entry("c", new Date(2026, 2, 5, 8, 40, 0).toISOString());
    const groups = previewGroups([a, b, c], 30);
    expect(groups).toEqual([[a, b, c]]);
  });
});
