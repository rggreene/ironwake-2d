import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {bestiary, labFormation, dummyPosition, labStage} from './bestiary-v38.mjs';

const file = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const runtime = file('./app-v38.js'), html = file('./index.html');
for (const id of ['bestiary-open','bestiary','lab-enemy','lab-range','lab-speed','lab-pause','lab-step','lab-close','lab-status'])
    assert.match(html, new RegExp('id="'+id+'"'));
const mixed = labFormation('mixed', 1, 245);
assert.deepEqual(mixed.map(e => e.kind), ['worker','worker','worker','worker','tank','light']);
for (const kind of Object.keys(bestiary).filter(k => k !== 'mixed')) {
    assert.deepEqual(labFormation(kind,1,bestiary[kind].range).map(e => e.kind),[kind]);
}
assert.deepEqual(dummyPosition('still',1),[0,0]);
assert.ok(dummyPosition('strafe',1)[1] > 0);

const player = {x:0,y:0,hp:120};
const lab = {active:true, paused:false, damage:0, hits:0, targetTime:0};
let elapsed = 0;
const calls = [];
const context = vm.createContext({
    lab, player, dummyPosition, enemies:[{grip:{mode:'latched'}}], gripSpeed:()=>.8,
    elapsed, hitFlash:0, fullSprite:{}, mech:{position:{set(){}}},
    $: id => ({value:id==='lab-target'?'strafe':'.5'}),
    syncBastionPose(){}, moveEnemies(dt,travel){calls.push(['enemies',dt,travel]);},
    updateHostileShots(){calls.push(['projectiles']);}, updateShotFlashes(){},updateParticles(){},labReadout(){},
    dead:false, serviceInvulnerable:0,carrierPhase:'idle',gameOver(){assert.fail('Lab cannot end a run');}
});
vm.runInContext(runtime.slice(runtime.indexOf('function damagePlayer('), runtime.indexOf('function gameOver(')), context);
vm.runInContext(runtime.slice(runtime.indexOf('function tickLab('),runtime.indexOf('function closeBestiary(')),context);
const ticker = runtime.slice(runtime.indexOf('function tick(dt)'),runtime.indexOf('function camera()'));
assert.ok(ticker.indexOf('if (lab.active)') < ticker.indexOf('updateSpawnDirector'));
assert.match(ticker,/tickLab\(Math.min\(dt, .05\) \* \+\$\('lab-speed'\).value\);\s+return;/);
context.damagePlayer(270);
assert.equal(player.hp,120);
assert.deepEqual([lab.hits,lab.damage],[1,270]);
context.tickLab(.05);
assert.equal(lab.targetTime,.05*.8);
assert.deepEqual(calls.map(x=>x[0]),['enemies','projectiles']);
assert.ok(calls[0][2]>0);
assert.equal(labStage({kind:'tank',tankState:'aim'},1.6),'aim');
console.log('PASS bestiary roster, mixed patrol, dummy motion, shared combat updates and progression isolation');
