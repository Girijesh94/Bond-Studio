export const WIDTH = 540, HEIGHT = 960;
export const ARENA = { x: 270, y: 475, radius: 244, top: 245 };
export const RADII = [12, 18, 25, 34, 45, 58, 74, 92];
export const FINAL_TIME = 60;
export const STARTER_COUNT = 128;
export class Simulation {
  constructor(onMerge = () => {}) { this.onMerge = onMerge; this.reset(); }
  reset() { this.balls = []; this.particles = []; this.elapsed = 0; this.nextDrop = 0; this.merges = 0; this.highest = 0; this.spawned = 0; this.shots = 0; this.lastShot = -Infinity; this.complete = false; this.finalAt = null; this.guides = []; this.id = 0; this.seed = 8271; }
  random() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  addBall(level = 0, x = ARENA.x, y = ARENA.top + 20, vx = 0, vy = 100) {
    const ball = { id: ++this.id, level, x, y, vx, vy, r: RADII[level], angle: 0, spin: (this.random() - .5) * 1.8, age: 0 };
    this.balls.push(ball); this.spawned++; return ball;
  }
  step(dt) {
    this.elapsed += dt;
    if (Math.abs(this.elapsed - FINAL_TIME) < 1e-7) this.elapsed = FINAL_TIME;
    if (!this.complete && this.shots < STARTER_COUNT && this.elapsed >= this.nextDrop && this.balls.length < 64) {
      this.addBall(0, ARENA.x, ARENA.top + 20, (this.random() - .5) * 150, 240);
      this.shots++; this.lastShot = this.elapsed;
      this.nextDrop = this.elapsed + .32;
    }
    for (const b of this.balls) {
      b.age += dt; b.vy += 345 * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.angle += b.spin * dt;
      // Reflect against the actual circular wall, inset by the ball radius.
      const dx = b.x - ARENA.x, dy = b.y - ARENA.y;
      const distance = Math.hypot(dx, dy), limit = ARENA.radius - b.r;
      if (distance > limit) {
        const nx = dx / distance, ny = dy / distance;
        b.x = ARENA.x + nx * limit; b.y = ARENA.y + ny * limit;
        const vn = b.vx * nx + b.vy * ny;
        if (vn > 0) { const impulse = Math.max(vn * 1.85, 210); b.vx -= impulse * nx; b.vy -= impulse * ny; }
      }
      const speed = Math.hypot(b.vx, b.vy); if (speed > 720) { b.vx *= 720 / speed; b.vy *= 720 / speed; }
    }
    this.guideFinale();
    const consumed = new Set(), births = [];
    for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) {
      const a = this.balls[i], b = this.balls[j]; if (consumed.has(a.id) || consumed.has(b.id)) continue;
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), sum = a.r + b.r;
      // A third ball can separate an already guided pair earlier in this
      // collision pass. Preserve its scheduled contact at the guide endpoint.
      const dueGuide = a.level === b.level && this.guides.find(g => this.elapsed >= g.end && ((g.a === a && g.b === b) || (g.a === b && g.b === a)));
      if (d >= sum && !dueGuide) continue;
      const finalePair = a.level === 6 && b.level === 6;
      if (finalePair && this.elapsed < FINAL_TIME - 1e-7) continue;
      if (a.level === b.level && a.level < 7 && a.age > .12 && b.age > .12) {
        consumed.add(a.id); consumed.add(b.id);
        births.push({ level: a.level + 1, x: dueGuide ? dueGuide.x : (a.x + b.x) / 2, y: dueGuide ? dueGuide.y : (a.y + b.y) / 2, vx: (a.vx + b.vx) / 2 + (this.random() - .5) * 110, vy: Math.min(-140, (a.vy + b.vy) / 2 - 170) });
        continue;
      }
      if (d < .001) { dx = 1; dy = 0; d = 1; }
      const nx = dx / d, ny = dy / d, overlap = sum - d, ma = a.r ** 2, mb = b.r ** 2, total = ma + mb;
      a.x -= nx * overlap * mb / total; a.y -= ny * overlap * mb / total;
      b.x += nx * overlap * ma / total; b.y += ny * overlap * ma / total;
      const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (relative < 0) {
        const impulse = -(1 + .88) * relative / (1 / ma + 1 / mb);
        a.vx -= impulse * nx / ma; a.vy -= impulse * ny / ma;
        b.vx += impulse * nx / mb; b.vy += impulse * ny / mb;
      }
    }
    if (consumed.size) this.balls = this.balls.filter(b => !consumed.has(b.id));
    for (const b of births) {
      this.addBall(b.level, b.x, b.y, b.vx, b.vy); this.merges++; this.highest = Math.max(this.highest, b.level);
      if (b.level === 7) { this.complete = true; this.finalAt = FINAL_TIME; }
      for (let i = 0; i < 14; i++) { const angle = this.random() * Math.PI * 2, speed = 35 + this.random() * 110; this.particles.push({ x: b.x, y: b.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .5, level: b.level }); }
      this.onMerge(b.level);
    }
    for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.particles = this.particles.filter(p => p.life > 0);
  }
  guideFinale() {
    // Late-run attraction completes actual equal-stage pairs; it never replaces
    // the population with a final image. All 128 starters are conserved.
    const live = new Set(this.balls);
    this.guides = this.guides.filter(g => live.has(g.a) && live.has(g.b));
    for (let level = 0; level <= 6; level++) {
      const start = level === 6 ? 56 : 42 + level * 2;
      const end = level === 6 ? FINAL_TIME : start + 1.8;
      if (this.elapsed < start || this.complete) continue;
      const assigned = new Set(this.guides.flatMap(g => [g.a, g.b]));
      const candidates = this.balls.filter(b => b.level === level && !assigned.has(b)).sort((a, b) => a.id - b.id);
      for (let i = 0; i + 1 < candidates.length; i += 2) {
        const a = candidates[i], b = candidates[i + 1];
        this.guides.push({ a, b, start: Math.min(this.elapsed, end - .1), end, ax: a.x, ay: a.y, bx: b.x, by: b.y, x: level === 6 ? ARENA.x : Math.max(160, Math.min(380, (a.x + b.x) / 2)), y: level === 6 ? ARENA.y : Math.max(350, Math.min(610, (a.y + b.y) / 2)) });
      }
    }
    for (const g of this.guides) {
      const raw = Math.max(0, Math.min(1, (this.elapsed - g.start) / (g.end - g.start)));
      const p = raw * raw * (3 - 2 * raw), separation = g.a.r * (g.a.level === 6 ? .9999 : .97);
      g.a.x = g.ax + (g.x - separation - g.ax) * p; g.a.y = g.ay + (g.y - g.ay) * p;
      g.b.x = g.bx + (g.x + separation - g.bx) * p; g.b.y = g.by + (g.y - g.by) * p;
      g.a.vx = g.a.vy = g.b.vx = g.b.vy = 0;
    }
  }
}
