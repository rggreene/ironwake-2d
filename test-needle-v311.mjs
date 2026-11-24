import assert from 'node:assert/strict';
import { NEEDLE_SWEEP, advanceNeedle, needleState } from './needle-v311.mjs';

for (const side of [-1, 1]) {
    const state = needleState(side, 0);
    const shots = [];
    const fire = (...shot) => shots.push(shot);
    advanceNeedle(state, .025, 0, 0, 54, 0, -200, () => [0,0], fire);
    assert.equal(state.mode, 'brace');
    const center = state.angle;
    for (let i = 0; i < 40; i++) advanceNeedle(state, .025, 0, 0, 54, 140, 100, () => [0,0], fire);
    assert.deepEqual(shots, [[-Math.PI / 4,0,0],[-Math.PI / 2,0,0],[-3 * Math.PI / 4,0,0]]);
    assert.deepEqual(shots.map(([angle]) => angle), NEEDLE_SWEEP.map(offset => center + offset));
    assert.equal(state.mode, 'slip');
}
console.log('PASS locked right-center-left sweep for either flank side');
