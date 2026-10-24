import test from 'node:test';
import assert from 'node:assert/strict';
import { removePlainBackground, alphaBounds } from './image-processing.js';
test('logo cleanup removes edge background, preserves enclosed white, and trims padding', () => {
  const w = 12, h = 12, pixels = new Uint8ClampedArray(w * h * 4).fill(255);
  for (let y = 3; y <= 8; y++) for (let x = 3; x <= 8; x++) {
    const i = (y * w + x) * 4; pixels[i] = 40; pixels[i + 1] = 60; pixels[i + 2] = 80;
  }
  const middle = (5 * w + 5) * 4; pixels[middle] = pixels[middle + 1] = pixels[middle + 2] = 255;
  const result = removePlainBackground(pixels, w, h);
  assert.equal(result[3], 0); assert.equal(result[middle + 3], 255);
  assert.deepEqual(alphaBounds(result, w, h), {x:3,y:3,width:6,height:6});
});
test('background cleanup keeps a solid image and preserves existing transparency', () => {
  const solid = new Uint8ClampedArray(16 * 4).fill(255);
  assert.deepEqual(removePlainBackground(solid, 4, 4), solid);
  const transparent = new Uint8ClampedArray(16 * 4); transparent.set([40, 70, 120, 255], 5 * 4);
  assert.deepEqual(alphaBounds(removePlainBackground(transparent,4,4),4,4),{x:1,y:1,width:1,height:1});
});
