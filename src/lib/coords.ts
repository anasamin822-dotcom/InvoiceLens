import type { BoundingBox } from '../types';

/** Convert normalised (0–1) coordinates to pixel values given a container size. */
export function normalizedToPixel(
  box: BoundingBox,
  containerWidth: number,
  containerHeight: number,
): { left: number; top: number; width: number; height: number } {
  return {
    left: box.x * containerWidth,
    top: box.y * containerHeight,
    width: box.w * containerWidth,
    height: box.h * containerHeight,
  };
}

/** Convert pixel rect to normalised (0–1) coordinates. */
export function pixelToNormalized(
  left: number,
  top: number,
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number,
): BoundingBox {
  return {
    x: left / containerWidth,
    y: top / containerHeight,
    w: width / containerWidth,
    h: height / containerHeight,
  };
}
