import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { NEEDLE_SHOT, NEEDLE_RANGE, advanceNeedle, needleState } from './needle-v35.mjs';
import { bearing, pose, wrap, COOLDOWN } from './wardog-v32.mjs';
import { muleFacing, muleFrame } from './mule-v33.mjs';
import * as mule from './mule-grab-v34.mjs';

const runtime = readFileSync(new URL('./app-v35.js', import.meta.url), 'utf8');
const position = () => ({ set() {} });
const view = () => ({ position: position(), scale: { x: .6, y: .6 } });
const player = { x: 0, y: 0 }, shots = [];
const warning = { clear() {}, moveTo() { return this; }, lineTo() { return this; }, stroke() {} };
const light = { kind: 'light', x: -105, y: 0, speed: 54, view: view(), seed: 0, warning, needle: needleState(1,.12) };
const tank = { kind: 'tank', x: 145, y: 0, speed: 24, radius: 14, animation: 0, seed: 0, view: view(),
    hull: {}, turret: { position: position() }, tankState: 'travel', tankStateTimer: 0,
    tankRecoil: 0, shotTimer: 0, hullHeading: -Math.PI/2, turretHeading: -Math.PI/2, attack: 1 };
const worker = { kind: 'worker', x: 0, y: 23, speed: 40, view: view(), seed: 0,
    grip: mule.grabState(), muleFacing: 1, muleBaseScale: .5, muleDistance: 0 };
const frames = (directions, count) => Array.from({length:directions}, (_, dir) =>
    Array.from({length:count}, (_, row) => ({dir,row})));
const ctx = vm.createContext({
    ...mule, muleFacing, muleFrame, NEEDLE_RANGE, NEEDLE_SHOT, advanceNeedle, bearing, pose, wrap, COOLDOWN,
    directorTuning: {}, enemyGrid: () => new Map(), ThreatDirector: { multipliers: () => ({damage:1}) },
    EnemyRoster: { definitions: { worker: {contact:3, interval:1.1} } },
    textures: { enemyFrames: {light:frames(1,4)[0],worker:frames(1,4)[0]},
        wardogHullDirs:frames(8,4),wardogTurretDirs:frames(8,2) },
    player, enemies: [light,tank,worker], serviceInvulnerable: 0, particles: [], wardogIllustrated:true,
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)), rand: (a,b) => (a+b)/2,
    particle() {}, fireFlash() {}, ejectCasing() {}, damagePlayer() {},
    enemyProjectile: (e, dx, dy, damage, spread, x, y, profile) => shots.push({kind:e.kind,dx,dy,x,y,profile})
});
vm.runInContext(runtime.slice(runtime.indexOf('function releaseMule'), runtime.indexOf('function dropAt')),ctx);
const step = () => ctx.moveEnemies(.025, 0);

for (let i = 0; i < 7; i++) step();
assert.equal(light.needle.mode, 'brace');
assert.ok(Math.abs(light.y) > 1, 'Needle first moves laterally');
const locked = light.needle.angle, planted = [light.x,light.y];
for (let i = 0; i < 14; i++) step();
assert.equal(worker.grip.mode, 'latched');
assert.equal(tank.tankState, 'aim');
assert.deepEqual([light.x,light.y], planted);
assert.equal(shots.length, 0);
for (let i = 0; i < 26; i++) step();
assert.equal(shots.filter(s => s.kind === 'tank').length, 1);
const burst = shots.filter(s => s.kind === 'light');
assert.equal(burst.length, 3);
assert.ok(burst.every(s => s.profile === NEEDLE_SHOT && s.dx === Math.cos(locked) && s.dy === Math.sin(locked)));
assert.ok(Math.hypot(light.x-planted[0],light.y-planted[1]) > 8, 'Needle slips out after its burst');
for (let i = 0; i < 10; i++) step();
assert.equal(light.needle.mode, 'recover');
const recoveryPosition = [light.x,light.y];
for (let i = 0; i < 7; i++) step();
assert.deepEqual([light.x,light.y], recoveryPosition);

const dodge = needleState(1,0), aim = [];
advanceNeedle(dodge,.025,-100,0,54,0,0,() => [-75,0], () => {});
for (let i = 0; i < 35; i++)
    advanceNeedle(dodge,.025,-100,0,54,0,40,() => [-75,0], angle => aim.push(angle));
assert.deepEqual(aim,[0,0,0], 'Dodge out of the lane after the Needle commits');
console.log('PASS Needle flank, locked dodgeable burst, slip and recovery alongside Mule latch and Wardog fire');
