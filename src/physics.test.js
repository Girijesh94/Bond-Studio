import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, ARENA, RADII, FINAL_MERGE_TIME } from './physics.js';
import { SEMITONES, BondAudio } from './audio.js';

test('matching balls create exactly one next-stage ball and one sound event', () => {
  const events = [], sim = new Simulation(level => events.push(level)); sim.nextDrop = Infinity;
  const a = sim.addBall(2, 250, 500), b = sim.addBall(2, 275, 500); a.age = b.age = 1;
  sim.step(1 / 120); assert.equal(sim.balls.length, 1); assert.equal(sim.balls[0].level, 3); assert.deepEqual(events, [3]); assert.equal(sim.merges, 1);
});
test('different levels collide without merging; final forms never merge', () => {
  for (const levels of [[2, 3], [7, 7]]) { const sim = new Simulation(); sim.nextDrop = Infinity; const a = sim.addBall(levels[0], 250, 500), b = sim.addBall(levels[1], 275, 500); a.age = b.age = 1; sim.step(1 / 120); assert.equal(sim.balls.length, 2); assert.equal(sim.merges, 0); assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r - .01); }
});
test('two-minute run stays finite, bounded in population, and progresses', () => {
  const sim = new Simulation(); for (let i = 0; i < 14400; i++) sim.step(1 / 120);
  assert.ok(sim.balls.length <= 64); assert.ok(sim.merges > 100); assert.ok(sim.highest >= 5);
  for (const b of sim.balls) { assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite)); assert.ok(b.y < 800 && b.y > 0); }
});
test('restart produces a repeatable simulation and clears statistics', () => {
  const sim = new Simulation(); for (let i = 0; i < 1200; i++) sim.step(1 / 120); const balls = JSON.stringify(sim.balls);
  sim.reset(); assert.equal(sim.elapsed, 0); assert.equal(sim.merges, 0); for (let i = 0; i < 1200; i++) sim.step(1 / 120); assert.equal(JSON.stringify(sim.balls), balls);
});
test('every ball size reflects inward from all directions on the circular wall', () => {
  for (let level = 0; level < 8; level++) {
    for (let side = 0; side < 8; side++) {
      const sim = new Simulation(); sim.nextDrop = Infinity;
      const angle = side * Math.PI / 4, nx = Math.cos(angle), ny = Math.sin(angle);
      const b = sim.addBall(level, ARENA.x + nx * ARENA.radius, ARENA.y + ny * ARENA.radius, nx * 100, ny * 100);
      sim.step(1 / 120);
      assert.ok(b.vx * nx + b.vy * ny < 0);
      assert.ok(Math.hypot(b.x - ARENA.x, b.y - ARENA.y) + RADII[level] <= ARENA.radius + .001);
    }
  }
});
test('shared and per-image sounds both deepen with each higher stage', () => {
  const engine = new BondAudio(), rates = [];
  const param = { setValueAtTime(){}, linearRampToValueAtTime(){} };
  engine.context = { state:'running', currentTime:0, createGain:()=>({connect(){},gain:param}), createBufferSource:()=>{ const playbackRate = { value:0 }; rates.push(playbackRate); return {playbackRate,connect(){},start(){},stop(){}}; } };
  engine.shared = { duration:1 }; engine.play(5, 'ball'); assert.equal(rates[0].value, 2 ** (SEMITONES[5] / 12));
  engine.overrides.set('ball', {duration:1}); engine.play(5, 'ball'); assert.equal(rates[1].value, 2 ** (SEMITONES[5] / 12));
  for (let i = 1; i < SEMITONES.length; i++) assert.ok(SEMITONES[i] < SEMITONES[i - 1]);
});
test('cannon fires through the 60th second and completes the final bond before the clip ends', () => {
  for (const hz of [30, 60, 120]) for (const seed of [1, 8271, 17291]) {
    const events = [], sim = new Simulation(level => events.push({level, time: sim.elapsed})); sim.seed = seed;
    for (let tick = 1; tick <= hz * 60; tick++) {
      sim.step(1 / hz);
      assert.equal(sim.balls.reduce((mass, b) => mass + 2 ** b.level, 0), sim.shots);
      if (sim.elapsed < FINAL_MERGE_TIME - 1e-7) assert.ok(sim.highest < 7);
    }
    assert.equal(sim.shots, 128); assert.equal(sim.merges, 127); assert.ok(sim.finalAt >= 59 && sim.finalAt < 60); assert.ok(sim.lastShot >= 59 && sim.lastShot < sim.finalAt);
    assert.equal(sim.balls.length, 1); assert.equal(sim.balls[0].level, 7);
    assert.equal(events.filter(e => e.level === 7).length, 1); assert.ok(events.at(-1).time >= 59 && events.at(-1).time < 60);
    sim.step(1); assert.equal(sim.shots, 128); assert.equal(sim.balls.length, 1);
  }
});

test('all eight ball sizes are distinct and increase; first two are comfortably visible', () => {
  assert.ok(RADII[0] >= 24); assert.ok(RADII[1] >= 32);
  for (let i = 1; i < RADII.length; i++) assert.ok(RADII[i] > RADII[i - 1]);
});
