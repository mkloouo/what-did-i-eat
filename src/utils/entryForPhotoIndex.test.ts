import { entryForPhotoIndex } from "./entryForPhotoIndex";
import { Entry } from "../types/models";

function entry(id: string): Entry {
  return {
    id,
    createdAt: "2026-01-01T00:00:00.000Z",
    comment: "",
    location: null,
    photos: [],
  };
}

describe("entryForPhotoIndex", () => {
  const entries = [entry("a"), entry("b"), entry("c")];
  const photosByEntry = [["a1", "a2"], ["b1"], ["c1", "c2", "c3"]];

  it("finds the entry owning the first photo", () => {
    expect(entryForPhotoIndex(photosByEntry, entries, 0)?.id).toBe("a");
  });

  it("finds the entry owning a photo in the middle of the first entry", () => {
    expect(entryForPhotoIndex(photosByEntry, entries, 1)?.id).toBe("a");
  });

  it("finds the entry owning a photo right after a boundary", () => {
    expect(entryForPhotoIndex(photosByEntry, entries, 2)?.id).toBe("b");
  });

  it("finds the entry owning the last photo", () => {
    expect(entryForPhotoIndex(photosByEntry, entries, 5)?.id).toBe("c");
  });

  it("returns undefined for an index past the end", () => {
    expect(entryForPhotoIndex(photosByEntry, entries, 6)).toBeUndefined();
  });

  it("returns undefined for a negative index", () => {
    expect(entryForPhotoIndex(photosByEntry, entries, -1)).toBeUndefined();
  });
});
