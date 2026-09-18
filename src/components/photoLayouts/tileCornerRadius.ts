import { Rect } from './types';

const EPSILON = 0.01;

export type TileCornerRadius = {
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomLeftRadius: number;
  borderBottomRightRadius: number;
};

// Rounds only the corners of a tile that actually sit at an outer corner of
// the whole collage (rect touches both of that corner's edges), so the
// collage's silhouette matches the card's rounded footprint while interior
// seams between tiles stay at the tighter innerRadius.
export function tileCornerRadius(
  rect: Rect,
  unitWidth: number,
  unitHeight: number,
  outerRadius: number,
  innerRadius: number
): TileCornerRadius {
  const touchesLeft = rect.x <= EPSILON;
  const touchesTop = rect.y <= EPSILON;
  const touchesRight = rect.x + rect.width >= unitWidth - EPSILON;
  const touchesBottom = rect.y + rect.height >= unitHeight - EPSILON;

  return {
    borderTopLeftRadius: touchesTop && touchesLeft ? outerRadius : innerRadius,
    borderTopRightRadius: touchesTop && touchesRight ? outerRadius : innerRadius,
    borderBottomLeftRadius: touchesBottom && touchesLeft ? outerRadius : innerRadius,
    borderBottomRightRadius: touchesBottom && touchesRight ? outerRadius : innerRadius,
  };
}
