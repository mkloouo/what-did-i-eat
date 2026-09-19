import reducer, {
  setGroupingMode,
  setRollingWindowMinutes,
  setWallColumns,
  setInferDateFromFirstImportedPhoto,
  setCaptureLocation,
} from "./settingsSlice";

const baseState = {
  groupingMode: "rolling" as const,
  rollingWindowMinutes: 60,
  wallColumns: 4,
  inferDateFromFirstImportedPhoto: false,
  captureLocation: true,
};

describe("settingsSlice", () => {
  it("defaults to a 60-minute rolling window, 4 wall columns, and inferred-date off", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(baseState);
  });

  it("setGroupingMode switches mode", () => {
    const state = reducer(baseState, setGroupingMode("day"));
    expect(state.groupingMode).toBe("day");
  });

  it("setRollingWindowMinutes updates the window", () => {
    const state = reducer(baseState, setRollingWindowMinutes(120));
    expect(state.rollingWindowMinutes).toBe(120);
  });

  it("setWallColumns updates the column count", () => {
    const state = reducer(baseState, setWallColumns(6));
    expect(state.wallColumns).toBe(6);
  });

  it("setWallColumns clamps below the 3-column floor", () => {
    const state = reducer(baseState, setWallColumns(1));
    expect(state.wallColumns).toBe(3);
  });

  it("setWallColumns clamps above the 10-column ceiling", () => {
    const state = reducer(baseState, setWallColumns(20));
    expect(state.wallColumns).toBe(10);
  });

  it("setCaptureLocation toggles the flag", () => {
    const state = reducer(baseState, setCaptureLocation(false));
    expect(state.captureLocation).toBe(false);
  });

  it("setInferDateFromFirstImportedPhoto toggles the flag", () => {
    const state = reducer(baseState, setInferDateFromFirstImportedPhoto(true));
    expect(state.inferDateFromFirstImportedPhoto).toBe(true);
  });
});
