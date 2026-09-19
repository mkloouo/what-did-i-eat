import { Rect } from "./types";

const EPSILON = 0.01;

export type TileInsets = {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
};

// Padding for one tile so neighbouring tiles end up `seam` apart while tiles on
// the collage's outer edge stay flush with it. Each interior edge gets half the
// seam; the neighbour on the other side supplies the other half.
export function tileInsets(
  rect: Rect,
  unitWidth: number,
  unitHeight: number,
  seam: number,
): TileInsets {
  const half = seam / 2;
  return {
    paddingLeft: rect.x <= EPSILON ? 0 : half,
    paddingTop: rect.y <= EPSILON ? 0 : half,
    paddingRight: rect.x + rect.width >= unitWidth - EPSILON ? 0 : half,
    paddingBottom: rect.y + rect.height >= unitHeight - EPSILON ? 0 : half,
  };
}
