import test from 'node:test';
import assert from 'node:assert/strict';
import { MODES, ModeSimulation } from './modes.js';

const advance = (sim, seconds, hz = 60) => { for (let i = 0; i < seconds * hz; i++) sim.step(1 / hz); return sim; };
const state = sim => JSON.stringify({ balls: sim.balls, rings: sim.rings, stats: sim.stats, elapsed: sim.elapsed });

test('the catalogue has thirteen unique modes including the existing bond simulation', () => {
  assert.equal(MODES.length, 13);
  assert.equal(new Set(MODES.map(m => m.id)).size, 13);
  for (const mode of MODES) assert.ok(mode.name && mode.description && mode.icon);
});

test('every mode stays finite and bounded, finishes at sixty seconds, and reports finish once', () => {
  for (const mode of MODES.slice(1)) {
    const events = [], sim = new ModeSimulation(mode.id, {}, e => events.push(e));
    advance(sim, 60, 30);
    assert.equal(sim.elapsed, 60, mode.id);
    assert.equal(sim.complete, true, mode.id);
    assert.ok(sim.balls.length <= 96, mode.id);
    assert.ok(sim.threads.length <= 180, mode.id);
    assert.ok(sim.trails.length <= 350, mode.id);
    for (const b of sim.balls) {
      for (const key of ['x', 'y', 'vx', 'vy', 'r']) assert.ok(Number.isFinite(b[key]), `${mode.id}: ${key}`);
      assert.ok(b.r > 0 && b.r < 100);
      assert.ok(Math.abs(b.x) < 2000 && Math.abs(b.y) < 2000, mode.id);
    }
    assert.equal(events.filter(e => e.type === 'finish').length, 1, mode.id);
    const finished = state(sim); sim.step(1);
    assert.equal(state(sim), finished, mode.id);
  }
});

test('seeded replay is reproducible and independent of display frame rate', () => {
  for (const mode of MODES.slice(1)) {
    const a = new ModeSimulation(mode.id), b = new ModeSimulation(mode.id);
    a.reset(917); b.reset(917);
    advance(a, 4, 30); advance(b, 4, 120);
    assert.equal(state(a), state(b), mode.id);
    a.reset(917); advance(a, 4, 60);
    assert.equal(state(a), state(b), `${mode.id}: reset`);
  }
});

test('different seeds vary the initial motion of every mode', () => {
  for (const mode of MODES.slice(1)) {
    const a = new ModeSimulation(mode.id), b = new ModeSimulation(mode.id);
    a.reset(917); b.reset(2918);
    advance(a, 1); advance(b, 1);
    assert.notEqual(JSON.stringify(a.balls), JSON.stringify(b.balls), mode.id);
  }
});

test('spiral rotation changes its trajectory and supports reverse or stopped rotation', () => {
  const forward = new ModeSimulation('spiral', { rotation: .8 });
  const reverse = new ModeSimulation('spiral', { rotation: -.8 });
  const stopped = new ModeSimulation('spiral', { rotation: 0 });
  advance(forward, 4); advance(reverse, 4); advance(stopped, 4);
  assert.notEqual(JSON.stringify(forward.balls), JSON.stringify(reverse.balls));
  assert.notEqual(JSON.stringify(forward.balls), JSON.stringify(stopped.balls));
});

test('the modes exhibit their advertised mechanics', () => {
  const modes = Object.fromEntries(MODES.slice(1).map(m => [m.id, advance(new ModeSimulation(m.id), 60)]));
  assert.ok(modes.classic.stats.escapes > 0, 'rotating gaps allow escape');
  assert.ok(modes.infinite.balls.length > 1 && modes.infinite.wave > 1, 'escape multiplies the next wave');
  assert.ok(modes.destruction.stats.broken > 20, 'impacts remove wall segments');
  assert.ok(modes.accumulation.stats.stuck > 0, 'spikes capture balls');
  assert.ok(modes.collision.stats.collisions > 0 && modes.collision.balls.length > 2, 'collisions create new balls');
  assert.ok(modes.web.stats.threads > 0 && modes.web.balls[0].r > 22, 'wall contacts weave and the ball grows');
  assert.ok(modes.trail.trails.length > 0 && modes.trail.balls[0].r > 22, 'rainbow path grows');
  assert.ok(Math.hypot(modes.spiral.balls[0].x - 270, modes.spiral.balls[0].y - 475) > 170, 'spiral expands outward');
  assert.ok(modes.fragment.stats.splits > 0 && modes.fragment.balls.length > 1, 'spikes fragment growing balls');
  assert.ok(modes.battle.stats.threads > 0 && modes.battle.stats.cuts > 0 && modes.battle.balls.length < 4 && modes.battle.balls.length > 0, 'rival threads eliminate all but a survivor');
  assert.ok(modes.hill.stats.scores.some(score => score > 0), 'hill occupation earns time');
  assert.ok(modes.symmetric.stats.scores.reduce((sum, s) => sum + s, 0) > 0, 'peg drops reach collection bins');
});

test('symmetric drops preserve mirrored pairs through peg impacts', () => {
  const sim = new ModeSimulation('symmetric');
  for (let tick = 0; tick < 600; tick++) {
    sim.step(1 / 60);
    for (const right of sim.balls.filter(b => b.mirrorOf)) {
      const left = sim.balls.find(b => b.id === right.mirrorOf);
      if (!left) continue;
      assert.ok(Math.abs(left.x + right.x - 540) < 1e-9);
      assert.equal(left.y, right.y);
      assert.equal(left.vx, -right.vx);
    }
  }
});

test('controls affect the intended system and extreme inputs remain bounded', () => {
  const rings = new ModeSimulation('classic', { rings: 9, gap: 1.1 });
  assert.equal(rings.rings.length, 9); assert.equal(rings.rings[0].gap, 1.1);
  const hill = new ModeSimulation('hill', { count: 8 }); assert.equal(hill.balls.length, 8);
  const trails = new ModeSimulation('trail', { trail: 23 }); advance(trails, 2); assert.equal(trails.trails.length, 23);
  const sim = new ModeSimulation('fragment', { gravity: 100000, speed: 100000, bounce: 100000 });
  advance(sim, 5); assert.ok(sim.balls.every(b => Number.isFinite(b.x) && Number.isFinite(b.y)));
  sim.configure({ trail: 45 }); assert.equal(sim.options.trail, 45);
  const before = sim.elapsed; sim.step(NaN); sim.step(-1); assert.equal(sim.elapsed, before);
});
