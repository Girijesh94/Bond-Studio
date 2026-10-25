// Original, deterministic simulations. All geometry is local to this canvas.
const TAU = Math.PI * 2, CX = 270, CY = 475, R = 238;
const COLORS = ['#ff729f', '#ffb955', '#e1eb70', '#6fe0a2', '#69d9ee', '#8c9bff', '#c491ff', '#f58fd0'];
export const MODES = [
  { id: 'merge', name: 'Bond', description: 'Combine matching images into eight growing forms.', icon: 'Combine' },
  { id: 'classic', name: 'Ring escape', description: 'Bounce through gaps in rotating concentric rings.', icon: 'CircleDot' },
  { id: 'infinite', name: 'Infinite loop', description: 'Every escape releases a new wave of bouncing balls.', icon: 'Infinity' },
  { id: 'destruction', name: 'Ring destruction', description: 'Break a circular wall one segment at a time.', icon: 'CircleDashed' },
  { id: 'accumulation', name: 'Spike garden', description: 'Balls collect on spikes while fresh shots search for an exit.', icon: 'Sun' },
  { id: 'collision', name: 'Collision burst', description: 'Two balls collide and become a growing crowd.', icon: 'Sparkles' },
  { id: 'web', name: 'Web expansion', description: 'A growing ball spins threads between wall contacts.', icon: 'Network' },
  { id: 'trail', name: 'Rainbow trail', description: 'A growing ball leaves a luminous path through the arena.', icon: 'Rainbow' },
  { id: 'spiral', name: 'Spiral escape', description: 'Follow a rotating spiral corridor toward the outside.', icon: 'Orbit' },
  { id: 'fragment', name: 'Fragment burst', description: 'Growing balls split into smaller pieces against spikes.', icon: 'Scan' },
  { id: 'battle', name: 'Web battle', description: 'Teams weave threads and cut their rivals out of the arena.', icon: 'Swords' },
  { id: 'hill', name: 'King of the hill', description: 'Compete for time inside the shifting central scoring zone.', icon: 'Crown' },
  { id: 'symmetric', name: 'Mirror drop', description: 'Mirrored streams cascade through a field of pegs.', icon: 'Columns2' },
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = v => (v % TAU + TAU) % TAU;
const angleDelta = (a, b) => Math.abs(wrap(a - b + Math.PI) - Math.PI);
const segmentDistance = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};

export class ModeSimulation {
  constructor(modeId, options = {}, onEvent = () => {}) {
    this.modeId = MODES.some(m => m.id === modeId && m.id !== 'merge') ? modeId : 'classic';
    this.onEvent = onEvent;
    this.options = { gravity: 400, speed: 1, count: 4, rings: 6, gap: .65, rotation: .42, trail: 150, bounce: 1, ...options };
    this.reset();
  }
  configure(options) { Object.assign(this.options, options); }
  random() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; }
  reset(seed = 8271) {
    this.seed = Number(seed) >>> 0; this.elapsed = 0; this.complete = false; this.accumulator = 0;
    this.balls = []; this.rings = []; this.threads = []; this.trails = []; this.particles = []; this.pegs = []; this.spikes = [];
    this.merges = 0; this.hits = 0; this.highest = 0; this.id = 0; this.nextSpawn = 0; this.wave = 1;
    this.stats = { escapes: 0, broken: 0, splits: 0, collisions: 0, threads: 0, cuts: 0, stuck: 0, scores: Array(8).fill(0) };
    // Seed variation is applied before the first frame, including modes that
    // otherwise never need random births. A shared phase preserves pair/team geometry.
    this.phase = (this.random() - .5) * TAU;
    const launch = (level, x, y, vx, vy, radius) => {
      const c = Math.cos(this.phase), s = Math.sin(this.phase);
      return this.addBall(level, x, y, vx * c - vy * s, vx * s + vy * c, radius);
    };
    const count = Math.round(clamp(Number(this.options.count) || 4, 1, 16));
    if (['classic', 'infinite'].includes(this.modeId)) {
      const n = this.modeId === 'infinite' ? 2 : Math.round(clamp(Number(this.options.rings) || 6, 2, 10));
      this.rings = Array.from({ length: n }, (_, i) => ({ r: 62 + i * (170 / Math.max(1, n - 1)), angle: i * .73 + this.phase, gap: clamp(Number(this.options.gap) || .65, .25, 1.6), active: true }));
      launch(0, CX, CY, 170, -215, 13);
    } else if (this.modeId === 'destruction') {
      this.rings = Array.from({ length: 3 }, (_, i) => ({ r: 100 + i * 65, segments: Array(28).fill(true), angle: i * .13 + this.phase }));
      launch(0, CX, CY, 190, -260, 16);
    } else if (['accumulation', 'fragment'].includes(this.modeId)) {
      this.spikes = Array.from({ length: this.modeId === 'fragment' ? 16 : 24 }, (_, i) => i * TAU / (this.modeId === 'fragment' ? 16 : 24)).filter(a => this.modeId !== 'accumulation' || angleDelta(a, -Math.PI / 2) > .25);
      launch(0, CX, CY - 70, 140, -180, this.modeId === 'fragment' ? 34 : 15);
      this.nextSpawn = 1;
    } else if (this.modeId === 'collision') {
      const dx = Math.cos(this.phase) * 100, dy = Math.sin(this.phase) * 100;
      launch(0, CX - dx, CY - dy, 180, 0, 24); launch(1, CX + dx, CY + dy, -180, 0, 24);
    } else if (this.modeId === 'symmetric') {
      for (let row = 0; row < 9; row++) for (let col = 0; col < 7; col++) {
        const x = 90 + col * 60 + (row % 2 ? 30 : 0);
        if (x < 470) this.pegs.push({ x, y: 300 + row * 48, r: 5 });
      }
      this.nextSpawn = 0;
    } else {
      const n = ['battle', 'hill'].includes(this.modeId) ? count : 1;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + this.phase, radius = n === 1 ? 30 : 125;
        this.addBall(i % 8, CX + Math.cos(a) * radius, CY + Math.sin(a) * radius, Math.cos(a + 1.7) * 230, Math.sin(a + 1.7) * 230, this.modeId === 'battle' ? 17 : 22);
      }
    }
  }
  addBall(level, x, y, vx, vy, r = 14) {
    if (this.balls.length >= 96) return null;
    const speed = clamp(Number(this.options.speed) || 1, .15, 3);
    const b = { id: ++this.id, level: level % 8, x, y, vx: vx * speed, vy: vy * speed, r, age: 0, angle: 0, cooldown: .25, health: 5, stuck: false, anchor: null };
    this.balls.push(b); this.highest = Math.max(this.highest, b.level); return b;
  }
  event(type, b, extra = {}) { this.onEvent({ type, level: b?.level ?? 0, time: this.elapsed, ...extra }); }
  bounce(b, nx, ny) {
    const vn = b.vx * nx + b.vy * ny;
    if (vn > 0) {
      const impulse = vn * (1 + clamp(Number(this.options.bounce) || 1, .5, 1.3));
      b.vx -= impulse * nx; b.vy -= impulse * ny;
      this.hits++; this.event('bounce', b);
      this.particles.push({ x: b.x + nx * b.r, y: b.y + ny * b.r, life: .35, level: b.level });
      return true;
    }
    return false;
  }
  wall(b) {
    const dx = b.x - CX, dy = b.y - CY, d = Math.hypot(dx, dy), limit = R - b.r;
    if (d < limit) return false;
    const nx = dx / (d || 1), ny = dy / (d || 1);
    b.x = CX + nx * limit; b.y = CY + ny * limit;
    return this.bounce(b, nx, ny);
  }
  step(dt) {
    if (this.complete || !Number.isFinite(dt) || dt <= 0) return;
    this.accumulator += Math.min(dt, 1);
    const h = 1 / 120;
    while (this.accumulator + 1e-9 >= h && !this.complete) {
      this.accumulator -= h; this.elapsed = Math.min(60, this.elapsed + h);
      if (60 - this.elapsed < 1e-7) this.elapsed = 60;
      this.tick(h);
      if (this.elapsed === 60) { this.complete = true; this.event('finish', null); }
    }
  }
  tick(dt) {
    const kind = this.modeId, gravity = clamp(Number(this.options.gravity) || 0, 0, 1000);
    const rotation = clamp(Number(this.options.rotation) || 0, -2, 2);
    for (const ring of this.rings) ring.angle += rotation * dt;
    this.particles = this.particles.filter(p => (p.life -= dt) > 0).slice(-160);
    if (kind === 'symmetric' && this.elapsed >= this.nextSpawn) {
      const offset = 25 + this.random() * 115, vx = (this.random() - .5) * 50;
      const left = this.addBall(this.wave % 8, CX - offset, 220, vx, 30, 10);
      const right = this.addBall(this.wave % 8, CX + offset, 220, -vx, 30, 10);
      if (left && right) right.mirrorOf = left.id;
      this.wave++; this.nextSpawn += .65;
    }
    if (kind === 'accumulation' && this.elapsed >= this.nextSpawn) {
      this.addBall(this.wave++ % 8, CX, CY - 100, (this.random() - .5) * 290, -190, 15);
      this.nextSpawn += .8;
    }
    const remove = new Set(), births = [];
    for (const b of this.balls) {
      b.age += dt; b.cooldown -= dt; b.angle += dt * .5;
      if (b.stuck) continue;
      const px = b.x, py = b.y;
      b.vy += gravity * dt * (['collision', 'battle', 'hill'].includes(kind) ? .12 : 1);
      if (kind === 'spiral') {
        const a = Math.atan2(b.y - CY, b.x - CX), dist = Math.hypot(b.x - CX, b.y - CY);
        const target = Math.min(224, 28 + b.age * 6), tangent = rotation * 600;
        b.vx += (Math.cos(a + Math.PI / 2) * tangent + Math.cos(a) * (target - dist) * 12 - b.vx * 1.4) * dt;
        b.vy += (Math.sin(a + Math.PI / 2) * tangent + Math.sin(a) * (target - dist) * 12 - b.vy * 1.4 - gravity) * dt;
      }
      if (['web', 'trail'].includes(kind)) b.r = Math.min(64, b.r + dt * .7);
      if (kind === 'fragment') b.r = Math.min(52, b.r + dt * 2.1);
      b.x += b.vx * dt; b.y += b.vy * dt;
      const dist = Math.hypot(b.x - CX, b.y - CY), angle = Math.atan2(b.y - CY, b.x - CX);
      if (['classic', 'infinite', 'destruction'].includes(kind)) {
        for (const ring of this.rings) {
          if (ring.active === false) continue;
          const pd = Math.hypot(px - CX, py - CY), side = pd <= ring.r ? 1 : -1;
          if ((pd - ring.r) * (dist - ring.r) <= 0 || Math.abs(dist - ring.r) < b.r) {
            if (!ring.segments && angleDelta(angle, ring.angle) < ring.gap / 2) {
              if (pd < ring.r && dist >= ring.r) { ring.active = false; this.stats.escapes++; this.event('escape', b); }
              continue;
            }
            if (ring.segments) {
              const segment = Math.floor(wrap(angle - ring.angle) / TAU * ring.segments.length);
              if (!ring.segments[segment]) continue;
              ring.segments[segment] = false; this.stats.broken++; this.event('split', b);
            }
            const nx = Math.cos(angle) * side, ny = Math.sin(angle) * side;
            b.x = CX + Math.cos(angle) * (ring.r - side * (b.r + .5)); b.y = CY + Math.sin(angle) * (ring.r - side * (b.r + .5));
            this.bounce(b, nx, ny); break;
          }
        }
        if (dist > R + b.r + 15) {
          remove.add(b.id); this.stats.escapes++; this.event('escape', b);
          if (kind === 'infinite') {
            this.wave++; this.rings.forEach((ring, i) => { ring.active = true; ring.angle += .6 + i * .2; });
            for (let i = 0; i < Math.min(8, this.wave); i++) births.push({ level: (b.level + 1) % 8, x: CX, y: CY, vx: (this.random() - .5) * 420, vy: -160 - this.random() * 180, r: 12 });
          } else births.push({ level: (b.level + 1) % 8, x: CX, y: CY, vx: 180, vy: -200, r: 14 });
        }
      } else if (kind === 'symmetric') {
        for (const peg of this.pegs) {
          const dx = b.x - peg.x, dy = b.y - peg.y, d = Math.hypot(dx, dy), sum = b.r + peg.r;
          if (d < sum) {
            const nx = dx / (d || 1), ny = dy / (d || 1);
            b.x = peg.x + nx * sum; b.y = peg.y + ny * sum;
            this.bounce(b, -nx, -ny);
            // Resolve a perfectly centered peg impact symmetrically.
            if (Math.abs(dx) < .05) b.vx += (b.x <= CX ? -1 : 1) * 25;
          }
        }
        if (b.x < 42 + b.r || b.x > 498 - b.r) { const nx = b.x < CX ? -1 : 1; b.x = clamp(b.x, 42 + b.r, 498 - b.r); this.bounce(b, nx, 0); }
        if (b.y > 830) { remove.add(b.id); this.stats.scores[b.level]++; this.event('score', b); }
      } else {
        const contact = this.wall(b);
        if (contact && ['web', 'battle'].includes(kind)) {
          const anchor = { x: CX + Math.cos(angle) * R, y: CY + Math.sin(angle) * R };
          if (b.anchor) {
            this.threads.push({ ax: b.anchor.x, ay: b.anchor.y, bx: anchor.x, by: anchor.y, level: b.level, owner: b.id }); this.stats.threads++;
          }
          b.anchor = anchor;
        }
        if (contact && ['accumulation', 'fragment'].includes(kind)) {
          const spike = this.spikes.find(a => angleDelta(a, angle) < .075);
          if (spike !== undefined && b.cooldown < 0) {
            if (kind === 'accumulation') {
              b.stuck = true; b.vx = b.vy = 0; this.stats.stuck++; this.event('collision', b);
              if (this.balls.filter(v => v.stuck).length > 60) remove.add(this.balls.find(v => v.stuck).id);
            } else if (b.r > 16) {
              remove.add(b.id); this.stats.splits++; this.event('split', b);
              for (let i = -1; i <= 1; i++) {
                const a = angle + Math.PI + i * .6;
                births.push({ level: (b.level + 1) % 8, x: b.x - Math.cos(angle) * 20, y: b.y - Math.sin(angle) * 20, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, r: Math.max(10, b.r * .5) });
              }
            }
          } else if (kind === 'accumulation' && angleDelta(angle, -Math.PI / 2) < .16) { remove.add(b.id); this.stats.escapes++; this.event('escape', b); }
        }
        if (kind === 'battle' && b.cooldown < 0) {
          const hit = this.threads.findIndex(t => t.owner !== b.id && segmentDistance(b.x, b.y, t.ax, t.ay, t.bx, t.by) < b.r);
          if (hit >= 0) {
            const thread = this.threads.splice(hit, 1)[0]; this.stats.cuts++; b.health--; b.cooldown = .4; this.event('collision', b);
            this.stats.scores[thread.level]++;
            if (b.health <= 0 && this.balls.length - remove.size > 1) { remove.add(b.id); this.event('escape', b); }
          }
        }
        if (kind === 'hill') {
          const hx = CX + Math.cos(this.elapsed * .3) * 35, hy = CY + Math.sin(this.elapsed * .3) * 35;
          b.vx += (hx - b.x) * dt * .55; b.vy += (hy - b.y) * dt * .55;
          if (Math.hypot(b.x - hx, b.y - hy) < 65) {
            const previous = Math.floor(this.stats.scores[b.level]); this.stats.scores[b.level] += dt;
            if (Math.floor(this.stats.scores[b.level]) > previous) this.event('score', b);
          }
        }
      }
      if (['trail', 'spiral'].includes(kind) || (kind === 'web' && b.age % .03 < dt)) this.trails.push({ x: b.x, y: b.y, r: b.r * .65, level: b.level, hue: this.elapsed * 35 + b.id * 40 });
      const speed = Math.hypot(b.vx, b.vy), max = 650;
      if (speed > max) { b.vx *= max / speed; b.vy *= max / speed; }
    }
    if (['collision', 'battle', 'hill', 'accumulation'].includes(kind)) {
      for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) {
        const a = this.balls[i], b = this.balls[j];
        if (remove.has(a.id) || remove.has(b.id) || (a.stuck && b.stuck)) continue;
        let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), sum = a.r + b.r;
        if (d >= sum) continue;
        if (d < .001) { dx = 1; dy = 0; d = 1; }
        const nx = dx / d, ny = dy / d, overlap = sum - d;
        if (!a.stuck) { a.x -= nx * overlap * (b.stuck ? 1 : .5); a.y -= ny * overlap * (b.stuck ? 1 : .5); }
        if (!b.stuck) { b.x += nx * overlap * (a.stuck ? 1 : .5); b.y += ny * overlap * (a.stuck ? 1 : .5); }
        const v = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (v < 0) {
          if (!a.stuck) { a.vx += v * nx; a.vy += v * ny; } if (!b.stuck) { b.vx -= v * nx; b.vy -= v * ny; }
          if (a.cooldown <= 0 && b.cooldown <= 0) {
            this.stats.collisions++; this.event('collision', a); a.cooldown = b.cooldown = .8;
            if (kind === 'collision' && this.balls.length + births.length < 64) {
              const angle = this.random() * TAU;
              births.push({ level: (Math.max(a.level, b.level) + 1) % 8, x: (a.x + b.x) / 2 + Math.cos(angle) * 26, y: (a.y + b.y) / 2 + Math.sin(angle) * 26, vx: Math.cos(angle) * 260, vy: Math.sin(angle) * 260, r: 12 });
            }
          }
        }
      }
    }
    if (kind === 'symmetric') for (const b of this.balls) {
      if (!b.mirrorOf) continue;
      const left = this.balls.find(other => other.id === b.mirrorOf);
      if (left) { b.x = 540 - left.x; b.y = left.y; b.vx = -left.vx; b.vy = left.vy; }
    }
    this.balls = this.balls.filter(b => !remove.has(b.id));
    for (const b of births) this.addBall(b.level, b.x, b.y, b.vx, b.vy, b.r);
    this.threads = this.threads.slice(-180); this.trails = this.trails.slice(-Math.round(clamp(Number(this.options.trail) || 150, 10, 350)));
  }
}

function line(ctx, ax, ay, bx, by) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
export function drawMode(ctx, sim, stages = [], images = new Map(), options = {}) {
  ctx.save(); ctx.fillStyle = '#05060b'; ctx.fillRect(0, 0, 540, 960);
  const rainbow = ctx.createConicGradient(sim.elapsed * .16, CX, CY);
  [...COLORS, COLORS[0]].forEach((c, i) => rainbow.addColorStop(i / 8, c));
  ctx.strokeStyle = rainbow; ctx.lineWidth = 3; ctx.shadowColor = '#9a80ff'; ctx.shadowBlur = 13;
  if (sim.modeId === 'symmetric') { ctx.beginPath(); ctx.roundRect(42, 205, 456, 630, 24); ctx.stroke(); }
  else { circle(ctx, CX, CY, R); ctx.stroke(); }
  ctx.shadowBlur = 0;
  if (sim.modeId === 'hill') {
    const hx = CX + Math.cos(sim.elapsed * .3) * 35, hy = CY + Math.sin(sim.elapsed * .3) * 35;
    circle(ctx, hx, hy, 65); ctx.fillStyle = '#ffca6630'; ctx.fill(); ctx.strokeStyle = '#ffca66'; ctx.setLineDash([4, 8]); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const [i, ring] of sim.rings.entries()) {
    if (ring.active === false) continue;
    ctx.strokeStyle = COLORS[i % 8]; ctx.lineWidth = 4;
    if (ring.segments) ring.segments.forEach((visible, j) => {
      if (!visible) return; const start = ring.angle + j * TAU / ring.segments.length;
      ctx.beginPath(); ctx.arc(CX, CY, ring.r, start + .018, start + TAU / ring.segments.length - .018); ctx.stroke();
    });
    else { ctx.beginPath(); ctx.arc(CX, CY, ring.r, ring.angle + ring.gap / 2, ring.angle + TAU - ring.gap / 2); ctx.stroke(); }
  }
  if (sim.modeId === 'spiral') {
    ctx.strokeStyle = '#a6a0f880'; ctx.lineWidth = 2; ctx.beginPath();
    const rotation = clamp(Number(sim.options.rotation) || 0, -2, 2);
    for (let i = 0; i <= 360; i++) { const a = i * .047 + sim.phase + sim.elapsed * rotation, r = 28 + i * .55; const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  }
  for (const a of sim.spikes) {
    ctx.fillStyle = '#d1d5e8'; ctx.beginPath();
    ctx.moveTo(CX + Math.cos(a - .028) * R, CY + Math.sin(a - .028) * R);
    ctx.lineTo(CX + Math.cos(a) * (R - 18), CY + Math.sin(a) * (R - 18));
    ctx.lineTo(CX + Math.cos(a + .028) * R, CY + Math.sin(a + .028) * R); ctx.fill();
  }
  for (const p of sim.pegs) { circle(ctx, p.x, p.y, p.r); ctx.fillStyle = '#8f92b5'; ctx.fill(); }
  sim.trails.forEach((p, i) => { ctx.globalAlpha = i / sim.trails.length * .6; ctx.fillStyle = `hsl(${p.hue},85%,65%)`; circle(ctx, p.x, p.y, p.r); ctx.fill(); }); ctx.globalAlpha = 1;
  for (const t of sim.threads) { ctx.strokeStyle = COLORS[t.level] + '88'; ctx.lineWidth = 1.3; line(ctx, t.ax, t.ay, t.bx, t.by); }
  for (const b of sim.balls) {
    const stage = stages[b.level], img = stage && images.get(stage.id);
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
    if (img) {
      if (stage.imageMode !== 'original') { circle(ctx, 0, 0, b.r); ctx.clip(); }
      const scale = (stage.imageMode === 'original' ? Math.min : Math.max)(b.r * 2 / img.width, b.r * 2 / img.height);
      ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
    } else {
      circle(ctx, 0, 0, b.r); ctx.shadowColor = COLORS[b.level]; ctx.shadowBlur = 12; ctx.fillStyle = stage?.color || COLORS[b.level]; ctx.fill();
      ctx.shadowBlur = 0; circle(ctx, -b.r * .28, -b.r * .3, b.r * .18); ctx.fillStyle = '#ffffffa0'; ctx.fill();
    }
    ctx.restore();
  }
  for (const p of sim.particles) { ctx.globalAlpha = p.life / .35; ctx.strokeStyle = COLORS[p.level]; ctx.lineWidth = 1.5; circle(ctx, p.x, p.y, 4 + (1 - p.life / .35) * 15); ctx.stroke(); } ctx.globalAlpha = 1;
  if (options.showTimer !== false) {
    ctx.fillStyle = '#bcc0d5'; ctx.font = '500 19px "DM Sans Variable", sans-serif'; ctx.textAlign = 'center';
    const s = Math.min(60, Math.floor(sim.elapsed)); ctx.fillText(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, CX, 904);
  }
  ctx.restore();
}
