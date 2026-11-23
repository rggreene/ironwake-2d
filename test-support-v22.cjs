const assert=require('node:assert/strict');const fs=require('fs');const vm=require('vm');const child=require('child_process');
child.execFileSync('npx',['tsc','src/supportWeapons.ts','--outFile','support-temp.js','--module','none','--target','ES2022','--skipLibCheck'],{stdio:'pipe'});
const sandbox={Math,console};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('support-temp.js','utf8'),sandbox);fs.unlinkSync('support-temp.js');
const w=sandbox.SupportWeapons;let n=0;const check=(v,m)=>{assert.ok(v,m);n++};
for(const k of ['pd','grenade','missile']){
 const s=w.definitions[k];w.validate(s);check(s.damage>0&&s.cooldown>0&&s.range>0,`${k} baseline`);
 for(let level=1;level<=8;level++){const t=w.stats(k,level);check(t.damage>=s.damage&&t.cooldown<=s.cooldown&&t.cooldown>0,`${k} level ${level}`);}
}
const player={x:0,y:0};const target=[{kind:'worker',x:25,y:0,hp:10,max:10},{kind:'boss',x:175,y:0,hp:600,max:600},{kind:'heavy',x:60,y:0,hp:100,max:100}];
check(w.selectTarget('pd',target,player,100).kind==='worker','PD nearest');
check(w.selectTarget('missile',target,player,300).kind==='boss','missile boss priority');
check(w.selectTarget('missile',target,player,100).kind==='heavy','missile armored priority');
check(w.selectTarget('grenade',target,player,100).kind==='worker','grenade local target');
check(w.selectTarget('pd',[],player,100)===null,'empty enemies no fire');
check(w.selectTarget('pd',target,player,15)===null,'out of range no fire');
check(Math.abs(w.turnToward(Math.PI-.1,-Math.PI+.1,1)-(Math.PI+.1))<.0001,'homing wraps shortest direction');
const src=fs.readFileSync('src/main.ts','utf8');
for(const text of ['updateAuxProjectiles(dt)','updateSupportFire(dt)','SupportWeapons.selectTarget','auxShots.length>=135','supportLevels[k]=0','unlock-missile','grenade-boost','missile-boost','pd-boost'])check(src.includes(text),`integration ${text}`);
check(fs.readFileSync('src/enemyRoster.ts','utf8').includes('bossInterval=420'),'boss cadence unchanged');
console.log('PASS',n,'secondary weapon, targeting, upgrade, lifecycle and boss cadence checks');