import reducer, {
  setWallColumns,
  setInferDateFromFirstImportedPhoto,
  setCaptureLocation,
} from "./settingsSlice";

const baseState = {
  wallColumns: 4,
  inferDateFromFirstImportedPhoto: false,
  captureLocation: true,
};

describe("settingsSlice", () => {
  it("defaults to 4 photos per row, inferred-date off and location on", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(baseState);
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
