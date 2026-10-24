// Remove only edge-connected, near-uniform backgrounds. Enclosed light logo
// details remain intact; already-transparent uploads retain their alpha.
export function removePlainBackground(data, width, height, tolerance = 42) {
  const output = new Uint8ClampedArray(data);
  const corners = [0, width - 1, (height - 1) * width, width * height - 1];
  const colors = corners.filter(i => output[i * 4 + 3] > 240).map(i => [output[i * 4], output[i * 4 + 1], output[i * 4 + 2]]);
  const matching = i => {
    const p = i * 4;
    return output[p + 3] < 12 || colors.some(c => Math.hypot(output[p] - c[0], output[p + 1] - c[1], output[p + 2] - c[2]) < tolerance);
  };
  const seen = new Uint8Array(width * height), queue = new Int32Array(width * height); let head = 0, tail = 0;
  const push = i => { if (!seen[i] && matching(i)) { seen[i] = 1; queue[tail++] = i; } };
  for (let x = 0; x < width; x++) { push(x); push((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { push(y * width); push(y * width + width - 1); }
  while (head < tail) {
    const i = queue[head++], x = i % width; output[i * 4 + 3] = 0;
    if (x > 0) push(i - 1); if (x + 1 < width) push(i + 1);
    if (i >= width) push(i - width); if (i < width * (height - 1)) push(i + width);
  }
  // A solid image or edge-to-edge artwork is kept rather than erased.
  if (tail > width * height * .96) return new Uint8ClampedArray(data);
  return output;
}
export function alphaBounds(data, width, height) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 12) {
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  return right < 0 ? { x: 0, y: 0, width, height } : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
export async function prepareImage(source) {
  const img = new Image(); img.src = source; await img.decode();
  const c = document.createElement('canvas'), scale = Math.min(1, 512 / Math.max(img.width, img.height));
  c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale));
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, c.width, c.height);
  const originalImage = c.toDataURL('image/png');
  const circle = document.createElement('canvas'); circle.width = circle.height = 512;
  const cc = circle.getContext('2d'), side = Math.min(c.width, c.height);
  cc.beginPath(); cc.arc(256, 256, 256, 0, Math.PI * 2); cc.clip();
  cc.drawImage(c, (c.width - side) / 2, (c.height - side) / 2, side, side, 0, 0, 512, 512);
  const pixels = ctx.getImageData(0, 0, c.width, c.height);
  const cutout = removePlainBackground(pixels.data, c.width, c.height); pixels.data.set(cutout); ctx.putImageData(pixels, 0, 0);
  const bounds = alphaBounds(cutout, c.width, c.height), logo = document.createElement('canvas'); logo.width = bounds.width; logo.height = bounds.height;
  logo.getContext('2d').drawImage(c, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
  return { originalImage, circleImage: circle.toDataURL('image/png'), logoImage: logo.toDataURL('image/png') };
}
