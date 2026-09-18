import { parseExifDateTime } from "./exifDate";

describe("parseExifDateTime", () => {
  it("parses a standard EXIF date/time string", () => {
    const date = parseExifDateTime("2024:03:15 08:30:00");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(15);
    expect(date?.getHours()).toBe(8);
    expect(date?.getMinutes()).toBe(30);
  });

  it("returns null for undefined or null input", () => {
    expect(parseExifDateTime(undefined)).toBeNull();
    expect(parseExifDateTime(null)).toBeNull();
  });

  it("returns null for an empty or malformed string", () => {
    expect(parseExifDateTime("")).toBeNull();
    expect(parseExifDateTime("not a date")).toBeNull();
    expect(parseExifDateTime("2024-03-15T08:30:00Z")).toBeNull();
  });
});
