import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { muleFacing, muleFrame } from './mule-v33.mjs';
import * as rules from './mule-grab-v34.mjs';

const runtime = readFileSync(new URL('./app-v34.js', import.meta.url), 'utf8');
const player = {x:0,y:0};
const mule = {x:24,y:0,speed:40,grip:rules.grabState(),muleFacing:1,muleBaseScale:.5,muleDistance:0,seed:0,
    view:{position:{set(){}},scale:{}}};
let damage = 0, rounds = 0;
const context = vm.createContext({
    ...rules, muleFacing, muleFrame, player, serviceInvulnerable: 0,
    EnemyRoster:{definitions:{worker:{contact:3,interval:1.1}}},
    textures:{mulePoses:[[0,0,0,0],[1,1,1,1],[2,2,2,2]]},
    damagePlayer: n => { damage += n; },
    fireFlash: () => { rounds++; }
});
vm.runInContext(runtime.slice(runtime.indexOf('function releaseMule'), runtime.indexOf('function moveEnemies')), context);
const step = (dt, travel=0) => context.moveMule(mule,dt,player.x-mule.x,player.y-mule.y,Math.max(.001,Math.hypot(player.x-mule.x,player.y-mule.y)),travel,1);

assert.deepEqual([0,1,2,3,4,12].map(rules.gripSpeed),[1,.8,.55,.25,0,0]);
step(.05);
assert.equal(mule.grip.mode,'reach');
assert.equal(mule.view.texture,1);
player.x = -10;
step(.05);
assert.equal(mule.grip.mode,'chase');
assert.equal(rounds,0);
player.x = 0;
mule.grip.timer = 0;
step(.05);
for(let i=0;i<6;i++) step(.05);
assert.equal(mule.grip.mode,'latched');
assert.equal(mule.view.texture,2);
for(let i=0;i<15;i++) step(.05);
assert.equal(rounds,3);
assert.equal(damage,3);
player.x = 27;
step(.05,27);
assert.equal(mule.grip.mode,'chase');
assert.ok(mule.grip.timer > 0);
step(.05);
assert.equal(mule.grip.mode,'chase');
console.log('PASS Mule reach, dodge, latch, pin thresholds, burst damage, escape and regrab delay');
