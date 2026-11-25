import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { THRUSTER_DURATION, THRUSTER_COOLDOWN, advanceThruster, createThruster, igniteThruster } from './thruster-v313.mjs';

const state = createThruster();
assert.equal(igniteThruster(state, 0, 0, 1), false);
assert.equal(igniteThruster(state, 1, 0, 0), false);
assert.equal(state.cooldown, 0);
assert.ok(igniteThruster(state, -1, 1, 1));
assert.ok(Math.abs(state.x + Math.SQRT1_2) < 1e-12);
assert.equal(state.cooldown, THRUSTER_COOLDOWN);
assert.equal(igniteThruster(state, 1, 0, 1), false);

const fine = createThruster();
igniteThruster(fine, 1, 0, 1);
let travel = 0;
for (let i = 0; i < 24; i++) travel += advanceThruster(fine, .01, 1).travel;
assert.ok(Math.abs(travel - advanceThruster(state, THRUSTER_DURATION, 1).travel) < 1e-12);
assert.ok(Math.abs(travel * 94 - 53.58) < .01);
assert.equal(state.remaining, 0);
assert.equal(igniteThruster(state, 1, 0, 1), false);
advanceThruster(state, THRUSTER_COOLDOWN, 1);
assert.ok(igniteThruster(state, 1, 0, 1));
assert.equal(advanceThruster(state, .05, 0).travel, 0);
assert.equal(state.remaining, 0);

const app = readFileSync(new URL('./app-v313.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.match(html, /id="aim-touch"><button id="thruster"/);
assert.match(app, /k === ' '\) requestThruster\(\)/);
assert.match(app, /if\(touchAimUntil >= elapsed\)return lastTouchAim/);
const combat = app.slice(app.indexOf('function tick(dt)'), app.indexOf('function camera()'));
assert.ok(combat.indexOf('fireEquippedWeapons(dt)') > combat.indexOf('advanceThruster(thruster'));
assert.match(combat, /moveEnemies\(dt, Math.hypot\(player.x - beforeX, player.y - beforeY\)\)/);
console.log('PASS boost deadzone, direction, distance, cooldown, pin, inputs, held aim and combat integration');
