export interface Point {
  x: number;
  y: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface WellResult {
  id: string;
  row: number;
  col: number;
  center: Point;
  avgColor: RGB;
  intensity: number;
  cellCount: number;
}
