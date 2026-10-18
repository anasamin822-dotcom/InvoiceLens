import { describe, it, expect } from 'vitest';
import { normalizedToPixel, pixelToNormalized } from '../src/lib/coords';

describe('normalizedToPixel', () => {
  it('converts a full-coverage box', () => {
    const result = normalizedToPixel(
      { x: 0, y: 0, w: 1, h: 1 },
      800,
      600,
    );
    expect(result).toEqual({ left: 0, top: 0, width: 800, height: 600 });
  });

  it('converts a half-size centered box', () => {
    const result = normalizedToPixel(
      { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
      800,
      600,
    );
    expect(result.left).toBeCloseTo(200);
    expect(result.top).toBeCloseTo(150);
    expect(result.width).toBeCloseTo(400);
    expect(result.height).toBeCloseTo(300);
  });

  it('converts a small box in the top-right corner', () => {
    const result = normalizedToPixel(
      { x: 0.58, y: 0.08, w: 0.24, h: 0.04 },
      800,
      1100,
    );
    expect(result.left).toBeCloseTo(464);
    expect(result.top).toBeCloseTo(88);
    expect(result.width).toBeCloseTo(192);
    expect(result.height).toBeCloseTo(44);
  });
});

describe('pixelToNormalized', () => {
  it('converts pixel values back to normalised coordinates', () => {
    const result = pixelToNormalized(400, 300, 200, 100, 800, 600);
    expect(result.x).toBeCloseTo(0.5);
    expect(result.y).toBeCloseTo(0.5);
    expect(result.w).toBeCloseTo(0.25);
    expect(result.h).toBeCloseTo(1 / 6);
  });

  it('is the inverse of normalizedToPixel', () => {
    const box = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
    const W = 1200;
    const H = 900;
    const px = normalizedToPixel(box, W, H);
    const roundTrip = pixelToNormalized(px.left, px.top, px.width, px.height, W, H);
    expect(roundTrip.x).toBeCloseTo(box.x, 10);
    expect(roundTrip.y).toBeCloseTo(box.y, 10);
    expect(roundTrip.w).toBeCloseTo(box.w, 10);
    expect(roundTrip.h).toBeCloseTo(box.h, 10);
  });

  it('produces identical normalized coordinates when container is zoomed', () => {
    const baseW = 800;
    const baseH = 1000;
    const targetBox = { x: 0.15, y: 0.25, w: 0.35, h: 0.1 };

    // At 1.0x zoom
    const px1 = normalizedToPixel(targetBox, baseW, baseH);
    const norm1 = pixelToNormalized(px1.left, px1.top, px1.width, px1.height, baseW, baseH);

    // At 1.5x zoom (rendered container dimensions and drawn pixels both scale by 1.5x)
    const zoom = 1.5;
    const zoomedW = baseW * zoom;
    const zoomedH = baseH * zoom;
    const pxZoomed = {
      left: px1.left * zoom,
      top: px1.top * zoom,
      width: px1.width * zoom,
      height: px1.height * zoom,
    };
    const normZoomed = pixelToNormalized(
      pxZoomed.left,
      pxZoomed.top,
      pxZoomed.width,
      pxZoomed.height,
      zoomedW,
      zoomedH,
    );

    expect(normZoomed.x).toBeCloseTo(norm1.x, 10);
    expect(normZoomed.y).toBeCloseTo(norm1.y, 10);
    expect(normZoomed.w).toBeCloseTo(norm1.w, 10);
    expect(normZoomed.h).toBeCloseTo(norm1.h, 10);
  });
});
