import { WIDTH, HEIGHT, ARENA, RADII } from './physics.js';

const ink = '#27393b', paper = '#000000', teal = '#31766d';
const font = (ctx, size, weight = 500) => { ctx.font = `${weight} ${size}px "DM Sans Variable", sans-serif`; };
function roundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}
function imageInCircle(ctx, img, x, y, r) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  const scale = Math.max(r * 2 / img.width, r * 2 / img.height);
  ctx.drawImage(img, x - img.width * scale / 2, y - img.height * scale / 2, img.width * scale, img.height * scale); ctx.restore();
}
function ball(ctx, b, stages, images) {
  const stage = stages[b.level], img = images.get(stage.id), r = b.r;
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
  const pop = Math.min(1, .72 + b.age * 2); ctx.scale(pop, pop);
  if (img) {
    if (stage.imageMode === 'original') {
      const scale = Math.min(r * 2 / img.width, r * 2 / img.height);
      ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
    } else imageInCircle(ctx, img, 0, 0, r);
    ctx.restore(); return;
  }
  ctx.shadowColor = '#47344924'; ctx.shadowOffsetY = 4; ctx.shadowBlur = 9;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = img ? '#fffdf8' : stage.color; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = ink; ctx.lineWidth = Math.min(2.5, r * .09); ctx.stroke();
  if (img) imageInCircle(ctx, img, 0, 0, r - 2);
  else {
    // Ceramic tokens: an inset rim and a small off-centre highlight.
    ctx.beginPath(); ctx.arc(0, 0, r * .77, 0, Math.PI * 2); ctx.strokeStyle = '#47344927'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(-r * .3, -r * .38, r * .12, 0, Math.PI * 2); ctx.fillStyle = '#ffffffbb'; ctx.fill();
    if (r > 15) { font(ctx, Math.max(13, r * .6), 650); ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.level + 1, 0, 1); }
  }
  ctx.restore();
}

export function drawSimulation(ctx, sim, stages, images) {
  ctx.fillStyle = paper; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillStyle = ink;

  const { x, y, radius } = ARENA;
  // A restrained mint wall, twelve clock marks, and an amber time arc give
  // this arena its own treatment instead of copying the reference's rainbow.
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.strokeStyle = '#78bdae'; ctx.lineWidth = 3; ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const angle = -Math.PI / 2 + i / 12 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(angle) * (radius + 8), y + Math.sin(angle) * (radius + 8));
    ctx.lineTo(x + Math.cos(angle) * (radius + 12), y + Math.sin(angle) * (radius + 12));
    ctx.strokeStyle = sim.elapsed >= (i + 1) * 5 ? '#edba7b' : '#38474b'; ctx.lineWidth = 2; ctx.stroke();
  }
  if (sim.elapsed > 0) { ctx.beginPath(); ctx.arc(x, y, radius + 7, -Math.PI / 2, -Math.PI / 2 + Math.min(1, sim.elapsed / 60) * Math.PI * 2); ctx.strokeStyle = '#edba7b'; ctx.lineWidth = 1.5; ctx.stroke(); }
  // Barrel recoil, muzzle flash and smoke all use simulation time, so every
  // shot stays aligned with its projectile in previews and recorded video.
  const shotAge = sim.elapsed - sim.lastShot;
  const recoil = shotAge >= 0 && shotAge < .24 ? Math.sin(shotAge / .24 * Math.PI) * 10 : 0;
  ctx.save(); ctx.translate(0, y - radius - 205);
  roundRect(ctx, x - 44, 104, 88, 65, 25, ink);
  roundRect(ctx, x - 18, 117 - recoil, 36, 98, 9, teal, ink, 3);
  roundRect(ctx, x - 26, 196 - recoil, 52, 23, 6, '#57988c', ink, 3);
  ctx.beginPath(); ctx.arc(x, 132, 10, 0, Math.PI * 2); ctx.fillStyle = '#e4d9c8'; ctx.fill();
  if (shotAge >= 0 && shotAge < .13) {
    ctx.save(); ctx.translate(x, 224 - recoil); ctx.scale(1 - shotAge / .13, 1 - shotAge / .13);
    ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-6, 15); ctx.lineTo(0, 6); ctx.lineTo(7, 23); ctx.lineTo(16, 0); ctx.closePath(); ctx.fillStyle = '#f2ac56'; ctx.fill(); ctx.restore();
  }
  if (shotAge >= 0 && shotAge < .3) {
    ctx.save(); ctx.globalAlpha = .25 * (1 - shotAge / .3); ctx.fillStyle = '#9ba9a0';
    for (const sign of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sign * (22 + shotAge * 55), 219 + shotAge * 18, 5 + shotAge * 17, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
  }
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
  if (!sim.balls.length) {
    [{ level: 0, x: 270, y: 270 }, { level: 0, x: 310, y: 354 }, { level: 1, x: 158, y: 534 }, { level: 2, x: 240, y: 638 }, { level: 3, x: 360, y: 588 }, { level: 4, x: 168, y: 618 }, { level: 1, x: 380, y: 640 }].forEach(b => ball(ctx, { ...b, r: RADII[b.level], age: 1, angle: -.15 + b.level * .08 }, stages, images));
  } else sim.balls.forEach(b => ball(ctx, b, stages, images));
  for (const p of sim.particles) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 5); ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = stages[p.level].color; ctx.strokeStyle = ink; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(2, -1); ctx.lineTo(5, 0); ctx.lineTo(2, 1); ctx.lineTo(0, 4); ctx.lineTo(-2, 1); ctx.lineTo(-5, 0); ctx.lineTo(-2, -1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  stages.forEach((s, i) => {
    const bx = 46 + i * 64, by = 869, discovered = i <= sim.highest;
    ctx.globalAlpha = discovered ? 1 : .6;
    const img = images.get(s.id);
    if (!img) { ctx.beginPath(); ctx.arc(bx, by, 19, 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill(); ctx.strokeStyle = discovered ? ink : '#b3a5a5'; ctx.lineWidth = discovered ? 2 : 1; ctx.stroke(); }
    if (img && s.imageMode === 'original') { const scale = Math.min(38 / img.width, 38 / img.height); ctx.drawImage(img, bx - img.width * scale / 2, by - img.height * scale / 2, img.width * scale, img.height * scale); }
    else if (img) imageInCircle(ctx, img, bx, by, 19);
    else { font(ctx, 13, 600); ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.fillText(i + 1, bx, by + 5); }
    ctx.globalAlpha = 1;
  });
  ctx.textAlign = 'center'; font(ctx, 18, 550); ctx.fillStyle = '#b4bebe';
  const seconds = Math.min(60, Math.floor(sim.elapsed)); ctx.fillText(`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')} / 01:00`, 270, 928);
}
