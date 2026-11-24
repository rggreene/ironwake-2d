import assert from 'node:assert/strict';
import { NEEDLE_RANGE, NEEDLE_LANE, NEEDLE_SHOT, advanceNeedle, needleState } from './needle-v37.mjs';

const step = (state, x, fire = () => {}) =>
    advanceNeedle(state, .025, 0, 0, 54, x, 0, () => [22,-8], fire);
assert.equal(NEEDLE_RANGE, 300);
const state = needleState(1, 0);
step(state, 301);
assert.equal(state.mode, 'flank');
step(state, 300);
assert.equal(state.mode, 'brace');
const expected = Math.atan2(8, 278);
const shots = [];
for (let i = 0; i < 40; i++) step(state, 350, (...shot) => shots.push(shot));
assert.deepEqual(shots, Array.from({ length: 3 }, () => [expected,22,-8]));
assert.equal(state.mode, 'slip');
const maximumFrameTravel = NEEDLE_SHOT.speed * .05;
assert.ok(NEEDLE_SHOT.life * NEEDLE_SHOT.speed - maximumFrameTravel >= NEEDLE_RANGE);
assert.ok(Math.abs(NEEDLE_SHOT.life * NEEDLE_SHOT.speed - NEEDLE_LANE) < 1e-9);
console.log('PASS Needle 300-unit threshold, locked burst and projectile reach');
