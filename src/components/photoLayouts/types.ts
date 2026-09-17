export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PhotoLayoutResult = {
  rects: Rect[];
  unitWidth: number;
  unitHeight: number;
};
