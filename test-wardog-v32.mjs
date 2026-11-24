import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { BEARINGS, COOLDOWN, bearing, pose, wrap } from './wardog-v32.mjs';

const runtime = readFileSync(new URL('./app-v32.js', import.meta.url), 'utf8');
const frames = count => BEARINGS.map((_, dir) => Array.from({length: count}, (_, row) => ({dir, row})));
const textures = { wardogHullDirs: frames(4), wardogTurretDirs: frames(2) };
const position = () => ({ set() {} });
const tank = {
    kind: 'tank', x: 180, y: 0, speed: 24, seed: 0, animation: 0,
    turretHeading: 0, hullHeading: 0, tankState: 'travel', tankStateTimer: 0, tankRecoil: 0,
    shotTimer: 4, hull: {}, turret: {position: position()}, view: {position: position(), scale: {x: .92}}
};
const player = {x: 0, y: 0};
const shots = [], flashes = [], particles = [], casings = [];
const context = vm.createContext({
    BEARINGS, COOLDOWN, bearing, pose, wrap, textures, player, enemies: [tank],
    wardogIllustrated: true, directorTuning: {},
    ThreatDirector: { multipliers: () => ({ damage: 1 }) },
    enemyGrid: () => new Map(),
    clamp: (value, low, high) => Math.max(low, Math.min(high, value)),
    rand: (low, high) => (low + high) / 2,
    enemyProjectile: (...args) => shots.push(args),
    fireFlash: (...args) => flashes.push(args),
    particle: (...args) => particles.push(args),
    ejectCasing: (...args) => casings.push(args)
});
const start = runtime.indexOf("function moveEnemies(dt)");
const end = runtime.indexOf("\n}\n", start) + 3;
vm.runInContext(runtime.slice(start, end), context);
const move = context.moveEnemies;

move(.1);
assert.equal(tank.x, 180, 'Pivoting keeps the hull in place');
assert.ok(Math.abs(tank.y) < 1e-9);
assert.ok(tank.animation > 0);
move(.15);
assert.notEqual(tank.hull.texture.dir, tank.turret.texture.dir, 'Independent turret bearing');

for (let i = 0; i < 25; i++) move(.05);
assert.ok(tank.x < 180 && Math.abs(tank.hullHeading + Math.PI / 2) < .13);
Object.assign(tank, { x: 80, y: 0, hullHeading: -Math.PI / 2, animation: 0 });
move(.1);
assert.ok(tank.x > 80);
assert.ok(Math.abs(tank.y) < 1e-9);
assert.equal(tank.hull.texture.row, 3, 'Reverse wraps from track frame 0 to 3');

Object.assign(tank, { x: 140, y: 0, shotTimer: 0 });
const states = new Set();
for (let i = 0; i < 45; i++) {
    move(.025);
    states.add(tank.tankState);
    assert.equal(tank.x, 140);
    assert.ok(Math.abs(tank.y) < 1e-9);
}
assert.deepEqual([...states], ['brake','aim','recover']);
assert.equal(shots.length, 1);
assert.equal(flashes.length, 1);
assert.equal(particles.length, 5);
assert.equal(casings.length, 1);
const muzzle = pose(bearing(tank.hullHeading), bearing(tank.turretHeading), 0, true);
assert.deepEqual(shots[0].slice(5), [tank.x + muzzle.muzzleX * .92, tank.y + muzzle.muzzleY * .92]);
assert.deepEqual(flashes[0].slice(0, 2), shots[0].slice(5));
for (let i = 0; i < 95; i++) move(.05);
assert.equal(shots.length, 1, 'Wardog respects the five-second cooldown');
assert.equal(tank.tankState, 'travel');
assert.ok(tank.shotTimer > 0);
console.log('PASS Wardog pivot, forward/reverse tracks, independent aiming, fire states, muzzle, effects and cooldown');
