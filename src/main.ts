/* IRONWAKE // First Deployment. PixiJS 8 browser POC. v2.2 modular secondary weapons and boss counterplay from v1.8 industrial battlefield visual pass; Carrion behavior and threat director; fixed-forward continuous autocannon on reusable weapon architecture. */
declare const PIXI: any;

type EnemyKind = EnemyRoster.Kind;
type Enemy = { x:number;y:number;hp:number;max:number;speed:number;radius:number;kind:EnemyKind;view:any;attack:number;seed:number;animation:number;weave:number;shotTimer:number; windup:number; dashTimer:number; dashLeft:number; bossBar?:any; warning?:any; hull?:any; turret?:any; hullHeading:number };
type Bullet = {x:number;y:number;vx:number;vy:number;damage:number;life:number;view:any;remaining:number;hits:Set<Enemy>};
type AuxShot={kind:SupportWeapons.Kind;x:number;y:number;vx:number;vy:number;damage:number;life:number;radius:number;view:any;target:Enemy|null;hits:Set<Enemy>};
type Drop = {x:number;y:number;kind:'xp'|'salvage';value:number;view:any;life:number};
type Particle = {x:number;y:number;vx:number;vy:number;life:number;max:number;view:any};
type Wreck = {x:number;y:number;view:any;life:number};
type Upgrade = {id:string;name:string;info:string};
type HostileShot={x:number;y:number;vx:number;vy:number;life:number;damage:number;view:any};
const $ = (id:string):HTMLElement => {const v=document.getElementById(id);if(!v)throw new Error('Missing UI '+id);return v};
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const rand=(a:number,b:number)=>a+Math.random()*(b-a);
const sq=(x:number)=>x*x;
const dist=(x:number,y:number)=>Math.sqrt(sq(x)+sq(y));
const palette={armor:'#69785c',light:'#96a188',shadow:'#39483e',metal:'#222c30',dark:'#131b20',accent:'#d3a25e',red:'#fd392f',glass:'#162731'};
let app:any,world:any,ground:any,entities:any,effects:any,scene:any;
let W=640,H=360,last=0,elapsed=0,spawnClock=0,fireClock=0,screenShake=0,noticeUntil=0,paused=false,playing=false,leveling=false,dead=false,hangarFromGame=false,boopTimer=0;
let kills=0,xp=0,level=1,salvageRun=0,xpNeeded=14,hitFlash=0,shotsFired=0,peakProjectilesPerSecond=0,peakVolley=1;
let directorTuning:ThreatDirector.Tuning={...ThreatDirector.defaults};
let spawnBudget=0,recentDamage=0;let lastBossSpawn=-1,lastPrototypeSpawn=-1;let aimLane:any;
let queuedSpawn:ThreatDirector.Kind|null=null;
let permanentSalvage=Number(localStorage.getItem('ironwake_salvage')||0),armorOwned=localStorage.getItem('ironwake_armor')==='true';
let player={x:0,y:0,hp:120,max:120,speed:94,angle:0,fireRate:0.4,damage:25,bulletSpeed:360,range:320,multishot:1,spreadAngle:.085,penetration:0,armor:0,magnet:28,movePhase:0};
const enemies:Enemy[]=[];const hostileShots:HostileShot[]=[];const bullets:Bullet[]=[];const auxShots:AuxShot[]=[];const drops:Drop[]=[];const particles:Particle[]=[];const wrecks:Wreck[]=[];
let mech:any,body:any,torso:any,legs:any,leftLeg:any,rightLeg:any,leftArm:any,rightArm:any,gun:any,coreEye:any,armorOverlay:any;
const keys=new Set<string>();
let touchMove={x:0,y:0};
const supportLevels:Record<SupportWeapons.Kind,number>={pd:0,grenade:0,missile:0};
const supportCooldowns:Record<SupportWeapons.Kind,number>={pd:0,grenade:0,missile:0};
let supportMounts:any, supportGraphics:Record<SupportWeapons.Kind,any>={pd:null,grenade:null,missile:null};
let auxHits=0,bossDamage=0;
const upgradeCatalog:Upgrade[]=[
 {id:'unlock-pd',name:'12.7 MM DEFENSE GUN',info:'Auto-targets nearby threats independently. Upgrades increase its rate and damage.'},
 {id:'unlock-grenade',name:'40 MM GRENADE LAUNCHER',info:'Automatic explosive rounds that damage enemy clusters.'},
 {id:'unlock-missile',name:'GUIDED ANTI-ARMOR MISSILES',info:'Slow, precise homing strikes that prioritize heavy units and bosses.'},
 {id:'pd-boost',name:'PD GUN TUNING',info:'Defensive gun: increased fire rate and damage. Stacks.'},
 {id:'grenade-boost',name:'BLAST PACKAGE',info:'Grenade launcher: larger blast area and stronger explosions. Stacks.'},
 {id:'missile-boost',name:'ANTI-ARMOR PAYLOAD',info:'Missile system: increased damage and faster reload. Stacks.'},
 {id:'loading',name:'AUTOLOADER',info:'Weapon cycling +22% (faster fire). Stacks.'},
 {id:'overclock',name:'OVERDRIVE',info:'Firing interval -32%, damage -10%. Stack for a buzzsaw build.'},
 {id:'ammo',name:'HEAVY SLUGS',info:'Kinetic damage +35%.'},
 {id:'barrel',name:'LONG BARREL',info:'Projectile speed +20%; increased range.'},
 {id:'armor',name:'FIELD PLATING',info:'+25 maximum armor; restore 25 armor.'},
 {id:'servo',name:'SERVO TUNING',info:'Move speed +15%.'},
 {id:'targeting',name:'TARGET ACQUISITION',info:'Fire cycle +12%; extended acquisition range.'},
 {id:'pickup',name:'SALVAGE MAGNET',info:'Collect pickups from farther away.'},
 {id:'scatter',name:'MULTI-FEED',info:'+1 projectile per volley. Stacks up to 10.'},
 {id:'cluster',name:'SPREAD CHOKE',info:'Tighten the multishot grouping by 25%.'},
 {id:'pierce',name:'PENETRATOR SLUGS',info:'Each slug passes through +1 additional enemy.'},
 {id:'stabilizer',name:'STABILIZED DRIVE',info:'Fire cycle +15%, projectile speed +10%.'},
];
function rect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function pixelCanvas(w:number,h:number,draw:(c:CanvasRenderingContext2D)=>void):HTMLCanvasElement{const el=document.createElement('canvas');el.width=w;el.height=h;const c=el.getContext('2d')!;c.imageSmoothingEnabled=false;draw(c);return el}
function tex(w:number,h:number,draw:(c:CanvasRenderingContext2D)=>void):any{const canvas=pixelCanvas(w,h,draw);const t=PIXI.Texture.from(canvas);t.source.scaleMode='nearest';t.__sourceCanvas=canvas;return t}
function spr(texture:any,anchor=0.5):any{const s=new PIXI.Sprite(texture);s.anchor.set(anchor);return s}
function gfxCircle(r:number,color:string){return new PIXI.Graphics().circle(0,0,r).fill(color)}
// M14 Bastion v0.3: purpose-drawn, layered, humanoid top-down components.
// All parts face north (negative Y). Torso rotates separately from the gait.
function drawBastionPart(part:'hip'|'leftLeg'|'rightLeg'|'torso'|'leftArm'|'rightArm'|'gun'|'armor'|'eye'){
 const p=palette;
 return tex(96,96,c=>{
  const armor='#6c7b60',highlight='#a1ad8a',edge='#27343a',steel='#3b484a',shade='#435243',bolt='#bdba95';
  if(part==='hip'){
   // Narrow pelvis block positioned between the legs so the frame reads as upright.
   rect(c,34,40,28,12,edge);rect(c,38,42,20,8,steel);rect(c,40,43,16,4,armor);
   rect(c,35,50,10,6,edge);rect(c,51,50,10,6,edge);
   rect(c,42,47,12,3,shade);
  }
  if(part==='leftLeg'||part==='rightLeg'){
   // Long, load-bearing leg with a clear thigh, knee, shin and planted foot.
   rect(c,38,10,20,20,edge);rect(c,41,13,14,14,armor);rect(c,42,13,12,3,highlight);
   rect(c,42,28,12,10,steel);rect(c,44,30,8,7,bolt);
   rect(c,36,37,24,20,edge);rect(c,39,40,18,15,armor);rect(c,41,40,14,3,highlight);
   rect(c,41,49,14,4,shade);
   rect(c,34,56,28,19,edge);rect(c,37,59,22,14,steel);rect(c,39,60,18,4,highlight);
   rect(c,32,72,32,10,edge);rect(c,35,73,26,7,armor);rect(c,34,79,28,3,shade);
   rect(c,39,74,18,3,highlight);
  }
  if(part==='torso'){
   // Higher torso block, clear shoulder line, compact helmet-like sensor package.
   rect(c,29,58,38,9,edge);rect(c,35,59,26,6,steel);
   rect(c,22,22,52,37,edge);rect(c,27,25,42,31,armor);
   rect(c,30,26,36,4,highlight);rect(c,31,31,34,18,shade);
   rect(c,37,33,22,14,armor);rect(c,39,34,18,3,highlight);
   rect(c,13,30,17,18,edge);rect(c,16,32,13,14,armor);rect(c,18,32,10,3,highlight);
   rect(c,66,30,17,18,edge);rect(c,67,32,13,14,armor);rect(c,68,32,10,3,highlight);
   rect(c,39,9,18,16,edge);rect(c,42,7,12,16,steel);
   rect(c,41,12,14,4,armor);rect(c,43,11,10,2,highlight);
   rect(c,43,18,4,4,'#0e1c22');rect(c,49,18,4,4,'#0e1c22');
   rect(c,44,19,2,2,'#8cabb0');rect(c,50,19,2,2,'#8cabb0');
   rect(c,56,12,4,4,edge);rect(c,58,6,2,10,steel);
   rect(c,32,45,4,6,'#c2b995');rect(c,38,45,2,6,'#c2b995');
   rect(c,59,46,4,2,'#b3a279');
  }
  if(part==='leftArm'||part==='rightArm'){
   // Slimmer arm so the machine reads less like a quadruped.
   rect(c,38,16,20,16,edge);rect(c,41,18,14,11,armor);rect(c,42,18,12,3,highlight);
   rect(c,40,31,16,12,steel);rect(c,42,32,12,9,edge);
   rect(c,37,42,22,17,edge);rect(c,40,45,16,12,armor);rect(c,41,45,14,3,highlight);
   rect(c,40,57,16,10,steel);rect(c,42,60,12,6,shade);
   rect(c,42,66,12,9,edge);rect(c,44,68,8,5,armor);
  }
  if(part==='gun'){
   // Side-carried autocannon, clearly in-hand instead of center-mounted like a turret.
   rect(c,42,8,12,46,edge);rect(c,45,5,6,20,'#727e77');
   rect(c,45,4,6,16,'#c0bca1');rect(c,44,14,8,3,shade);
   rect(c,36,24,24,19,steel);rect(c,39,26,18,14,armor);rect(c,40,26,16,3,highlight);
   rect(c,34,36,28,5,edge);rect(c,40,43,15,8,edge);rect(c,42,45,11,5,shade);
   rect(c,42,51,12,12,'#514b3b');rect(c,44,54,8,7,bolt);
   rect(c,39,31,4,9,'#b1a078');rect(c,37,41,5,10,edge);
  }
  if(part==='armor'){
   rect(c,28,27,40,27,'#253439');rect(c,31,29,34,21,'#8c9b7d');
   rect(c,34,30,28,3,'#bdc5a8');rect(c,39,35,18,12,'#7b8e70');
   rect(c,43,35,8,11,'#455949');rect(c,35,50,26,4,'#586e5a');
   rect(c,16,32,13,14,'#8e9f80');rect(c,67,32,13,14,'#8e9f80');
   rect(c,17,33,11,3,'#c0c7a8');rect(c,68,33,11,3,'#c0c7a8');
  }
  if(part==='eye'){
   // Tiny red ready light, not a visor. Illuminates with the startup BOOP.
   rect(c,47,18,3,3,'#f92928');rect(c,47,18,1,1,'#ffdbcf');
  }
 });
}
// v0.8: render FULL-BODY illustrated frames. Never split the painted rifle or waist.
// Atlas rows: idle and three stride poses; directions S, SE, E, NE, N, NW, W, SW.
const BASTION_ATLAS_URL='assets/mechs/bastion/full_64.png';
const CARRION_ATLAS_BASE='assets/enemies/';
const BASTION_W=64, BASTION_H=96;
let fullFrames:any[][]=[], armoredFrames:any[][]=[];
let fullSprite:any,mechShadow:any;
let ambientDetails:any;
let facingLower=0,walkElapsed=0;
// Movement controls chassis and weapon-facing sprite. Fixed-forward weapons cannot rotate it.
const directionFor=WeaponKit.direction;
const forwardBearing=WeaponKit.bearing;
let visualFacing=0;
const weaponAims=new Map<string,WeaponKit.Solution|null>();
// Each equipped weapon gets its own definition and cooldown. Future slots can be added here.
const equippedWeapons:WeaponKit.WeaponDefinition[]=[WeaponKit.bastionAutocannon];
const weaponCooldowns=new Map<string,number>();
function currentWeaponStats():WeaponKit.WeaponStats{
 return {range:player.range,multishot:player.multishot,spreadAngle:player.spreadAngle,
  damage:player.damage,speed:player.bulletSpeed,penetration:player.penetration};
}
function weaponStats(def:WeaponKit.WeaponDefinition):WeaponKit.WeaponStats{
 return {...currentWeaponStats(),...(def.statOverrides||{})};
}
function updateWeaponAiming():void{
 // Independent weapon slots can still acquire targets; the Bastion's primary
 // fires forward continuously and never changes the illustrated facing.
 weaponAims.clear();visualFacing=facingLower;
 for(const [index,def] of equippedWeapons.entries()){
  const stats=weaponStats(def);
  const solution=def.triggerMode==='continuous'
   ?WeaponKit.solveForward(player,facingLower,def,stats)
   :( ()=>{const target=WeaponKit.pickTarget(player,enemies,facingLower,def,stats.range);
     return target?WeaponKit.solve(player,target,facingLower,def,stats):null;})();
  weaponAims.set(def.id,solution);
  if(index===0&&solution&&def.triggerMode!=='continuous')visualFacing=solution.facing;
 }
}
async function buildBastionAtlas(){
 const image=new Image();image.src=BASTION_ATLAS_URL;await image.decode();
 if(image.naturalWidth!==BASTION_W*8||image.naturalHeight!==BASTION_H*4)throw new Error('Invalid Bastion sprite atlas');
 fullFrames=[];armoredFrames=[];
 for(let row=0;row<4;row++){
  const regular:any[]=[],reinforced:any[]=[];
  for(let dir=0;dir<8;dir++){
   const px=dir*BASTION_W,py=row*BASTION_H;
   const original=tex(BASTION_W,BASTION_H,c=>c.drawImage(image,px,py,BASTION_W,BASTION_H,0,0,BASTION_W,BASTION_H));
   // Paint-color variant for armor ownership: adjust original armor pixels without
   // compositing rectangular patches over its weapon, chest, or hip joints.
   const upgraded=tex(BASTION_W,BASTION_H,c=>{
    c.drawImage(image,px,py,BASTION_W,BASTION_H,0,0,BASTION_W,BASTION_H);
    const pixels=c.getImageData(0,0,BASTION_W,BASTION_H);
    for(let i=0;i<pixels.data.length;i+=4){
     const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],a=pixels.data[i+3];
     // Olive armor surfaces only; don't recolor rifle, optics, or shadows.
     if(a>170&&r>=35&&g>=32&&b>=20&&g>r*.82&&g>b*.87&&r>b*.90){
      pixels.data[i]=Math.min(255,r+19);pixels.data[i+1]=Math.min(255,g+23);pixels.data[i+2]=Math.min(255,b+14);
     }
    }
    c.putImageData(pixels,0,0);
   });
   regular.push(original);reinforced.push(upgraded);
  }
  fullFrames.push(regular);armoredFrames.push(reinforced);
 }
}
function syncBastionPose(frame:number,dir:number){
 if(fullSprite)fullSprite.texture=(armorOwned?armoredFrames:fullFrames)[frame][dir];
}
const textures:any={};
function makeTextures(){
 textures.pdRound=tex(7,3,c=>{rect(c,0,1,6,2,'#ffdc99');rect(c,4,0,3,3,'#fff5c5')});
 textures.grenadeRound=tex(9,9,c=>{rect(c,2,2,6,6,'#6b765f');rect(c,3,1,4,3,'#d9af71');rect(c,6,3,2,2,'#fff1af')});
 textures.missileRound=tex(15,7,c=>{rect(c,2,2,10,4,'#9ca6a0');rect(c,10,3,4,2,'#d6c7a4');rect(c,0,1,3,2,'#da914f');rect(c,0,5,3,1,'#da914f')});
 textures.hip=drawBastionPart('hip');textures.leftLeg=drawBastionPart('leftLeg');textures.rightLeg=drawBastionPart('rightLeg');textures.torso=drawBastionPart('torso');textures.leftArm=drawBastionPart('leftArm');textures.rightArm=drawBastionPart('rightArm');textures.gun=drawBastionPart('gun');textures.armor=drawBastionPart('armor');textures.eye=drawBastionPart('eye');
 // Pixel art for three mechanically distinct enemy families.
 // These are not recolors: scout is a narrow drone, raider a compact two-leg frame,
 // brute a wide industrial assault chassis. Every enemy has two alternating gait frames.
 function enemyArt(kind:'scout'|'raider'|'brute',frame:number){
  const size=kind==='scout'?30:kind==='raider'?38:52;
  return tex(size,size,c=>{
   const ox=size/2,step=frame===0?-2:2;
   const C=(x:number,y:number,w:number,h:number,col:string)=>rect(c,Math.round(ox+x),y,w,h,col);
   if(kind==='scout'){
    C(-8,4,16,5,'#1c2529');C(-7,5,14,4,'#957d58');
    C(-11,9,5,16,'#222d31');C(6,9,5,16,'#222d31');
    for(let j=0;j<3;j++){C(-10,11+j*4,3,2,'#b4a074');C(7,11+j*4,3,2,'#b4a074')}
    C(-7,9,14,15,'#263338');C(-5,10,10,11,'#ab8760');C(-3,12,6,7,'#624c3b');
    C(-4,3,8,6,'#262e32');C(-3,4,6,4,'#b19869');C(-2,5,4,2,'#79c4cf');
    C(-4,23,3,4,'#605c4c');C(2,23,3,4,'#605c4c');
    C(-8,14+step,2,5,'#e6ae66');C(6,14-step,2,5,'#e6ae66');
   } else if(kind==='raider'){
    // Gray-red armored raider, twin legs, right-side ballistic weapon.
    C(-13,13+step,8,17,'#242b2e');C(5,13-step,8,17,'#242b2e');
    C(-11,14+step,5,13,'#61656a');C(6,14-step,5,13,'#61656a');
    C(-14,27+step,10,5,'#303336');C(4,27-step,10,5,'#303336');
    C(-14,7,28,15,'#1d282d');C(-11,9,22,12,'#74635d');
    C(-11,10,5,9,'#b16b52');C(6,10,5,9,'#b16b52');
    C(-6,11,12,8,'#40464a');C(-4,11,8,3,'#a68b73');
    C(-6,4,12,7,'#293439');C(-5,5,10,4,'#927565');C(-3,7,6,2,'#f19b60');
    C(12,12,4,15,'#20262a');C(13,5,2,14,'#a4a29a');
    C(-15,12,4,12,'#4c5352');C(-15,13,3,4,'#b06e4f');
    C(-4,23,8,3,'#b3a18a');
   } else {
    // Heavy angular siege frame with broad shoulders, visible knees and cannon.
    C(-17,17+step,13,26,'#25282b');C(4,17-step,13,26,'#25282b');
    C(-15,20+step,9,18,'#66574a');C(6,20-step,9,18,'#66574a');
    C(-18,39+step,15,7,'#25292c');C(3,39-step,15,7,'#25292c');
    C(-22,10,44,21,'#232a2d');C(-19,12,38,17,'#76594c');
    C(-21,12,10,15,'#9b6748');C(11,12,10,15,'#9b6748');
    C(-14,15,28,10,'#3d4142');C(-11,16,22,4,'#8a7865');
    C(-9,5,18,11,'#242b2d');C(-7,6,14,8,'#95755b');
    C(-4,9,8,3,'#ffb36d');C(-7,29,14,5,'#272b2f');
    C(15,19,8,17,'#242a2e');C(18,1,4,28,'#797f77');
    C(-23,15,5,15,'#34393b');C(-24,17,4,6,'#d09c63');
    C(0,1,2,6,'#a5a69a');
   }
  });
 }
 textures.enemyFrames={scout:[enemyArt('scout',0),enemyArt('scout',1)],raider:[enemyArt('raider',0),enemyArt('raider',1)],brute:[enemyArt('brute',0),enemyArt('brute',1)]};
 // Retain aliases for codepaths that inspect the texture dictionary.
 textures.scout=textures.enemyFrames.scout[0];textures.raider=textures.enemyFrames.raider[0];textures.brute=textures.enemyFrames.brute[0];
 // Distinct bright collectibles retain clarity on dark industrial terrain.
 textures.xp=tex(16,16,c=>{
  rect(c,5,1,6,2,'#102f41');rect(c,3,3,10,10,'#15354b');rect(c,5,2,6,12,'#326e93');
  rect(c,2,6,12,4,'#245576');rect(c,5,5,6,6,'#6de7f5');rect(c,6,5,4,3,'#d9ffff');
  rect(c,6,12,4,2,'#8ddfee');rect(c,0,7,2,2,'#78bad1');rect(c,14,7,2,2,'#78bad1');
 });
 textures.salvage=tex(16,16,c=>{
  rect(c,2,3,12,10,'#111d22');rect(c,3,2,10,12,'#6b5138');rect(c,4,4,8,8,'#c19a60');
  rect(c,5,5,6,5,'#f4d084');rect(c,6,6,4,3,'#fff1ad');rect(c,3,11,10,2,'#70583d');
  rect(c,1,7,14,2,'#3d4342');rect(c,7,1,2,3,'#bdab80');rect(c,7,13,2,2,'#f1c276');
 });
 textures.bullet=tex(14,5,c=>{rect(c,0,2,5,1,'#e69d4b');rect(c,4,1,7,3,'#d9bb7b');rect(c,10,0,4,5,'#fff2b3')});
 textures.hostileRound=tex(8,5,c=>{rect(c,0,1,6,3,'#c65d4e');rect(c,5,0,3,5,'#ffb48d')});
 textures.shell=tex(5,3,c=>{rect(c,0,0,5,3,'#be995b');rect(c,1,0,2,1,'#ffe1a1')});
 textures.spark=tex(9,9,c=>{rect(c,4,0,1,9,'#ef9c48');rect(c,0,4,9,1,'#ffa95c');rect(c,2,2,5,5,'#ffc46e');rect(c,3,3,3,3,'#fff5ba')});
 const wreckArt=(kind:'scout'|'raider'|'brute')=>tex(52,52,c=>{
  // Collapsed armor and fractured joints in palette matching the enemy type.
  const tone=kind==='scout'?'#8e7857':kind==='raider'?'#76645c':'#855a48';
  rect(c,11,26,32,14,'#1c2528');rect(c,15,21,25,18,tone);rect(c,18,23,17,8,'#363b3c');
  rect(c,6,30,12,8,'#4c4f49');rect(c,39,27,9,12,'#46433e');
  rect(c,16,39,10,5,'#4c4239');rect(c,29,40,13,5,'#383e3d');
  rect(c,22,24,4,3,'#e08b4c');rect(c,33,31,3,4,'#c0603a');
  rect(c,12,18,9,5,tone);rect(c,33,19,10,5,tone);
 });
 textures.wreckTypes={scout:wreckArt('scout'),raider:wreckArt('raider'),brute:wreckArt('brute')};textures.wreck=textures.wreckTypes.scout;
 // Industrial logistics zone: deterministic composed terrain, collision-free scenery.
 // Each 128px tile is deliberately composed at pixel scale, not randomized per frame.
 textures.tiles=[];
 for(let variant=0;variant<16;variant++)textures.tiles.push(tex(128,128,c=>{
  let z=(variant*394019+12711)>>>0;
  const rng=()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return z/4294967296};
  const slab=['#343c3d','#363e3d','#30393b','#374040'][variant%4];
  const R=(x:number,y:number,w:number,h:number,col:string)=>rect(c,x,y,w,h,col);
  R(0,0,128,128,slab);
  // Fine slab aggregate, faded rectangular maintenance patches and bevel seams.
  for(let y=0;y<128;y+=32)for(let x=0;x<128;x+=32){
   R(x,y,32,1,'#485252');R(x,y+31,32,1,'#252f32');R(x,y,1,32,'#444d4d');
   if(rng()<.4)R(x+5,y+6,18,12,'#394243');
   if(rng()<.32){R(x+7,y+22,14,2,'#424b4c');R(x+8,y+24,12,1,'#282f33')}
  }
  for(let i=0;i<138;i++){
   const x=Math.floor(rng()*128),y=Math.floor(rng()*128);
   R(x,y,rng()<.8?1:2,1,rng()<.5?'#454d4d':'#2c3436');
  }
  const seam=(x:number,y:number,w:number,h:number)=>{R(x+2,y+2,w,h,'#222a2d');R(x,y,w,h,'#4d5755');R(x+2,y+2,w-4,h-4,'#303a3c')};
  const stripe=(x:number,y:number,w:number)=>{R(x,y,w,4,'#9e8851');R(x,y+4,w,2,'#282e32');for(let n=0;n<w;n+=12)R(x+n,y+1,5,2,'#3d3a2f')};
  const oil=(x:number,y:number)=>{R(x-15,y-5,24,7,'#242d2f');R(x-9,y-9,17,5,'#263033');R(x+2,y,18,4,'#252f32');R(x-5,y-3,10,2,'#384140')};
  const grate=(x:number,y:number)=>{R(x-1,y-1,38,25,'#1b272b');R(x+1,y+1,34,21,'#68716a');R(x+3,y+3,30,17,'#212b2f');for(let n=0;n<6;n++)R(x+5+n*5,y+3,2,17,'#505e5b');R(x+2,y+23,33,2,'#171f22')};
  const crater=(x:number,y:number)=>{R(x-17,y-5,30,16,'#4a4842');R(x-13,y-10,24,19,'#252e30');R(x-8,y-6,14,10,'#20292c');R(x-11,y+8,18,3,'#54534c');for(let j=0;j<6;j++)R(x+(j*9)%39-18,y+(j*7)%27-12,2,2,'#747167')};
  const box=(x:number,y:number)=>{R(x+3,y+4,21,18,'#161f22');R(x,y,21,18,'#5d665f');R(x+3,y+3,15,12,'#788075');R(x+7,y+4,5,9,'#414a46');R(x,y+15,21,3,'#252f33');R(x+3,y+2,2,2,'#d0a86d')};
  const spool=(x:number,y:number)=>{R(x-2,y+3,22,13,'#232d30');R(x,y,18,12,'#9a7750');R(x+3,y+2,12,8,'#443d34');R(x+7,y+4,4,4,'#c59b66');R(x-2,y-1,22,3,'#b28c5b')};
  const pipe=(x:number,y:number)=>{R(x+2,y+3,49,7,'#192529');R(x,y,48,6,'#636d68');R(x,y,48,2,'#a1a69a');R(x+14,y-2,4,10,'#353c3a');R(x+37,y-2,4,10,'#353c3a')};
  const tire=(x:number,y:number)=>{for(let k=0;k<5;k++){R(x+k*8,y+k*2,6,2,'#222c2e');R(x+k*8,y+7+k*2,6,2,'#283234')}};
  const lane=(x:number,w:number)=>{R(x,0,w,128,'#3b4243');R(x,0,2,128,'#61675f');R(x+w-2,0,2,128,'#61675f');for(let y=7;y<128;y+=27)R(x+w/2-1,y,3,13,'#b0a178')};
  switch(variant){
   case 0: lane(43,42);break;
   case 1: stripe(0,83,128);grate(20,30);break;
   case 2: oil(40,60);tire(58,24);break;
   case 3: grate(56,28);R(9,10,41,3,'#796d54');R(9,13,41,2,'#272f32');break;
   case 4: seam(21,22,85,71);for(let y=33;y<88;y+=18)R(29,y,68,2,'#52615f');R(31,38,7,26,'#97835d');break;
   case 5: lane(31,64);stripe(0,111,128);break;
   case 6: box(14,21);box(38,28);R(14,18,45,2,'#766f57');oil(88,88);break;
   case 7: crater(49,58);crater(97,98);break;
   case 8: pipe(22,28);pipe(44,68);R(19,106,91,4,'#726f5b');break;
   case 9: spool(22,47);box(76,64);R(68,23,38,4,'#4b514e');break;
   case 10: stripe(7,10,110);R(15,24,98,2,'#857d60');R(17,95,94,3,'#766e58');grate(52,53);break;
   case 11: crater(88,31);tire(10,72);oil(58,95);break;
   case 12: seam(14,25,100,76);R(19,30,89,5,'#6f755f');for(let x=25;x<108;x+=19)R(x,32,11,2,'#2c3537');break;
   case 13: R(0,32,128,39,'#394347');R(0,32,128,2,'#67695a');R(0,68,128,2,'#222d31');R(9,47,110,3,'#ad9b6a');break;
   case 14: box(77,20);pipe(15,85);oil(29,37);break;
   case 15: crater(34,41);stripe(5,105,118);spool(88,50);break;
  }
  // Subdued grime, scratches and bolt patterns to avoid overwhelming combat sprites.
  for(let i=0;i<14;i++){const x=Math.floor(rng()*122),y=Math.floor(rng()*122);R(x,y,2+Math.floor(rng()*6),1,rng()<.5?'#535c57':'#252f31')}
 }));
 textures.tile=textures.tiles[0];
}

async function buildCarrionAtlas(){
 // Industrial enemy visuals are replaceable art assets, not gameplay data.
 // Keep the previous atlas as a graceful fallback for mobile / partially cached deployments.
 const kinds:EnemyKind[]=['worker','tank','light','heavy','prototype','boss'];
 for(const kind of kinds){
  const image=new Image();image.src=CARRION_ATLAS_BASE+kind+'.png?v=14';await image.decode();
  if(image.naturalWidth!==384||image.naturalHeight!==96)throw new Error('Invalid original enemy atlas for '+kind);
  const frames:any[]=[];
  for(let frame=0;frame<4;frame++)frames.push(tex(96,96,c=>c.drawImage(image,frame*96,0,96,96,0,0,96,96)));
  textures.enemyFrames[kind]=frames;textures[kind]=frames[0];
 }
 const wreck=new Image();wreck.src=CARRION_ATLAS_BASE+'wrecks_v14.png?v=14';await wreck.decode();
 if(wreck.naturalWidth!==576||wreck.naturalHeight!==96)throw new Error('Invalid original enemy wreck atlas');
 for(let i=0;i<kinds.length;i++)textures.wreckTypes[kinds[i]]=tex(96,96,c=>c.drawImage(wreck,i*96,0,96,96,0,0,96,96));
 textures.wreck=textures.wreckTypes.worker;
 const turretImage=new Image();turretImage.src=CARRION_ATLAS_BASE+'tank_turret.png?v=15';await turretImage.decode();
 if(turretImage.naturalWidth!==96||turretImage.naturalHeight!==96)throw new Error('Invalid Wardog turret texture');
 textures.tankTurret=tex(96,96,c=>c.drawImage(turretImage,0,0));
 // All four new atlases use 128px registered cells and preserve animation order.
 // Upload these as individual PNGs: prevents oversized index.html and stale-asset collisions.
 // Rare units get their own experimental chassis and mobile armor art, not scaled common enemies.
 const eliteKinds:EnemyKind[]=['prototype','boss'];
 for(const kind of eliteKinds){
  try{
   const source=new Image();source.src=`assets/enemies/${kind}_v21.png?v=21`;await source.decode();
   if(source.naturalWidth!==512||source.naturalHeight!==128)throw new Error('Invalid v2.1 elite atlas '+kind);
   textures.enemyFrames[kind]=Array.from({length:4},(_,i)=>tex(128,128,c=>c.drawImage(source,i*128,0,128,128,0,0,128,128)));
   const wreckImage=new Image();wreckImage.src=`assets/enemies/${kind}_wreck_v21.png?v=21`;await wreckImage.decode();
   if(wreckImage.naturalWidth!==128||wreckImage.naturalHeight!==128)throw new Error('Invalid v2.1 wreck '+kind);
   textures.wreckTypes[kind]=tex(128,128,c=>c.drawImage(wreckImage,0,0));
  }catch(error){console.warn('Using original '+kind+' art as fallback:',error)}
 }
 const upgraded:EnemyKind[]=['worker','tank','light','heavy'];
 for(const kind of upgraded){
  try{
   const source=new Image();source.src=`assets/enemies/${kind}_v20.png?v=20`;await source.decode();
   if(source.naturalWidth!==512||source.naturalHeight!==128)throw new Error('Incorrect frame layout');
   const frames:any[]=[];
   for(let i=0;i<4;i++)frames.push(tex(128,128,c=>c.drawImage(source,i*128,0,128,128,0,0,128,128)));
   const wreckImage=new Image();wreckImage.src=`assets/enemies/${kind}_wreck_v20.png?v=20`;await wreckImage.decode();
   if(wreckImage.naturalWidth!==128||wreckImage.naturalHeight!==128)throw new Error('Incorrect wreck layout');
   textures.enemyFrames[kind]=frames;textures[kind]=frames[0];
   textures.wreckTypes[kind]=tex(128,128,c=>c.drawImage(wreckImage,0,0));
  }catch(err){console.warn('Using previous '+kind+' art while new atlas loads:',err)}
 }
}


function makeMech(){
 mech=new PIXI.Container();
 mechShadow=new PIXI.Graphics().ellipse(0,34,24,8).fill({color:'#080d0d',alpha:.48});
 fullSprite=spr(fullFrames[0][0]);fullSprite.scale.set(1.08);
 // Startup LED is the only intentional overlay on the fully illustrated frame.
 coreEye=new PIXI.Graphics().circle(0,0,1.5).fill('#ff3434');
 coreEye.position.set(-7,-26);coreEye.visible=false;
 // Retain the legacy visual-upgrade bridge for existing hangar controls.
 armorOverlay={visible:false};
 mech.addChild(mechShadow,fullSprite,coreEye);
 supportMounts=new PIXI.Container();mech.addChild(supportMounts);
 const mountSpec:[SupportWeapons.Kind,number,number,string][]=[['pd',-22,-11,'#c9ae74'],['grenade',22,3,'#d48a50'],['missile',24,-25,'#93a9b9']];
 for(const [kind,x,y,color] of mountSpec){const mount=new PIXI.Container();mount.position.set(x,y);
  const metal=new PIXI.Graphics().roundRect(-6,-4,12,8,2).fill('#38474b').rect(-3,-8,6,6).fill(color).rect(-2,-13,4,8).fill('#242f34');
  mount.addChild(metal);mount.visible=false;supportMounts.addChild(mount);supportGraphics[kind]=mount;}
 entities.addChild(mech);return mech;
}
function renderPreview(){
 const holder=$('mech-preview');holder.replaceChildren();
 const cv=pixelCanvas(192,192,c=>{
  c.imageSmoothingEnabled=false;
  c.drawImage((armorOwned?armoredFrames:fullFrames)[0][0].__sourceCanvas,40,0,112,168);
 });
 cv.style.width='235px';cv.style.height='235px';cv.style.imageRendering='pixelated';holder.appendChild(cv);
}
function tileVariant(tx:number,ty:number){let h=Math.imul(tx,374761393)^Math.imul(ty,668265263);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))&15}
function createTileScene(){ground=new PIXI.Container();world.addChild(ground);for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){const tile=spr(textures.tiles[tileVariant(x,y)],0);tile.x=x*128;tile.y=y*128;ground.addChild(tile)}
 const rng=(()=>{let z=9876543;return()=>{z=(1664525*z+1013904223)>>>0;return z/4294967296}})();
 const g=new PIXI.Graphics();for(let i=0;i<170;i++){const x=(rng()-.5)*3600,y=(rng()-.5)*3600;const k=rng();if(k<.55){g.rect(x,y,rng()*8+4,1.5).fill('#65615a')}else if(k<.84){g.rect(x,y,14,6).fill('#3b4444');g.rect(x+2,y+2,10,1).fill('#65716c')}else{g.circle(x,y,5+rng()*11).fill({color:'#252c2e',alpha:.7})}}ground.addChild(g);
 scene=new PIXI.Container();world.addChild(scene);entities=new PIXI.Container();effects=new PIXI.Container();world.addChild(entities,effects);
 aimLane=new PIXI.Graphics().moveTo(0,30).lineTo(0,95).stroke({color:'#e8b879',alpha:.29,width:1});effects.addChild(aimLane);
}
function reset(){for(const e of enemies){e.bossBar?.destroy();e.warning?.destroy()}for(const group of [enemies,bullets,auxShots,hostileShots,drops,particles,wrecks]){for(const item of group as any[])item.view?.destroy({children:true});group.length=0}
 player={x:0,y:0,hp:armorOwned?155:120,max:armorOwned?155:120,speed:94,angle:0,fireRate:.4,damage:25,bulletSpeed:360,range:320,multishot:1,spreadAngle:.085,penetration:0,armor:armorOwned?2:0,magnet:28,movePhase:0};
 elapsed=spawnClock=fireClock=screenShake=0;spawnBudget=0;recentDamage=0;queuedSpawn=null;lastBossSpawn=-1;lastPrototypeSpawn=-1;kills=xp=salvageRun=shotsFired=peakProjectilesPerSecond=0;peakVolley=1;level=1;xpNeeded=14;leveling=dead=false;paused=false;mech.position.set(0,0);coreEye.visible=false;facingLower=0;visualFacing=0;walkElapsed=0;weaponAims.clear();weaponCooldowns.clear();for(const k of supportKinds){supportLevels[k]=0;supportCooldowns[k]=0;}auxHits=bossDamage=0;updateSupportMounts();
 syncBastionPose(0,0);updateHUD();updateWeaponStats();}
function spawnEnemy(kind:EnemyKind){
 const angle=rand(0,Math.PI*2),r=Math.max(W,H)/2+(kind==='boss'?120:65);
 const x=player.x+Math.cos(angle)*r,y=player.y+Math.sin(angle)*r;
 const spec=EnemyRoster.definitions[kind],scale=ThreatDirector.multipliers(directorTuning);
 const hp=spec.hp*scale.hp*(1+elapsed/1600);
 // Wardog: animated tracked hull and an independently aiming physical turret.
 const view=kind==='tank'?new PIXI.Container():spr(textures.enemyFrames[kind][0]);
 const bossBar=kind==='boss'?new PIXI.Graphics():undefined;
 const warning=kind==='boss'?new PIXI.Graphics():undefined;
 if(bossBar){effects.addChild(bossBar);effects.addChild(warning)}
 let hull:any, turret:any;
 if(kind==='tank'){hull=spr(textures.enemyFrames.tank[0]);turret=spr(textures.tankTurret);turret.visible=false;view.addChild(hull,turret);}
 view.position.set(x,y);view.rotation=0;view.scale.set(spec.scale*(textures.enemyFrames[kind][0].width===128?.75:1));entities.addChild(view);
 enemies.push({x,y,hp,max:hp,speed:spec.speed*scale.speed,radius:spec.radius,kind,view,hull,turret,hullHeading:0,attack:rand(.2,.8),seed:rand(0,10),animation:0,weave:rand(0,Math.PI*2),shotTimer:rand(2.1,3.3),windup:0,dashTimer:6,dashLeft:0,bossBar,warning});
 if(kind==='boss')notice('WARNING // MA-0 GOLIATH APPROACHING');
 else if(kind==='prototype')notice('ELITE CONTACT // PX-1 VIPER');
}
function updateSpawnDirector(dt:number){
 recentDamage=Math.max(0,recentDamage-dt*4);
 const cap=ThreatDirector.cap(elapsed,directorTuning);
 // Reserved elite events, limited to one prototype and one boss at a time.
 if(EnemyRoster.hasBoss(elapsed,lastBossSpawn,enemies.some(e=>e.kind==='boss'))){
  spawnEnemy('boss');lastBossSpawn=elapsed;
 }else if(EnemyRoster.hasPrototype(elapsed,lastPrototypeSpawn,enemies.some(e=>e.kind==='prototype'))){
  spawnEnemy('prototype');lastPrototypeSpawn=elapsed;
 }
 spawnBudget=Math.min(20,spawnBudget+ThreatDirector.budgetPerSecond(elapsed,directorTuning,recentDamage)*dt);
 if(enemies.length>=cap)return;
 let count=0;
 while(spawnBudget>=1&&enemies.length<cap&&count<6){
  const kind=queuedSpawn ?? ThreatDirector.choose(elapsed,directorTuning,Math.random());
  queuedSpawn=kind;
  const price=ThreatDirector.cost[kind];
  if(spawnBudget<price)break;
  spawnEnemy(kind);spawnBudget-=price;queuedSpawn=null;count++;
 }
}

// Spatial hashing keeps Marauder separation linear in typical swarm scenarios.
const HASH_CELL=45;
function enemyGrid(){
 const grid=new Map<string,Enemy[]>();
 for(const e of enemies){const cx=Math.floor(e.x/HASH_CELL),cy=Math.floor(e.y/HASH_CELL),key=cx+','+cy;let list=grid.get(key);if(!list){list=[];grid.set(key,list)}list.push(e)}
 return grid;
}
function enemyProjectile(e:Enemy,dx:number,dy:number,damageScale:number,spread=0){
 if(hostileShots.length>=80)return;
 const speed=e.kind==='boss'?112:94,d=Math.max(1,Math.hypot(dx,dy));
 const cs=Math.cos(spread),sn=Math.sin(spread),ux=(dx/d)*cs-(dy/d)*sn,uy=(dx/d)*sn+(dy/d)*cs;
 const originX=e.kind==='tank'?e.x+dx/d*43*EnemyRoster.definitions.tank.scale:e.x;
 const originY=e.kind==='tank'?e.y+dy/d*43*EnemyRoster.definitions.tank.scale:e.y;
 const v=spr(textures.hostileRound);v.position.set(originX,originY);v.rotation=Math.atan2(uy,ux);
 effects.addChild(v);
 hostileShots.push({x:originX,y:originY,vx:ux*speed,vy:uy*speed,life:4,damage:(e.kind==='boss'?6:6)*damageScale,view:v});
}
function moveEnemies(dt:number){
 const grid=enemyGrid(),damageScale=ThreatDirector.multipliers(directorTuning).damage;
 for(let i=enemies.length-1;i>=0;i--){
  const e=enemies[i],dx=player.x-e.x,dy=player.y-e.y,d=Math.max(.001,Math.hypot(dx,dy));
  let vx=dx/d,vy=dy/d;
  if(e.kind==='prototype'){
   e.dashTimer-=dt;
   if(e.dashTimer<=0){e.dashTimer=6.4;e.dashLeft=.38;}
   e.dashLeft=Math.max(0,e.dashLeft-dt);
  }
  if(e.kind==='light'||e.kind==='prototype'){
   const wave=Math.sin(elapsed*3.1+e.weave)*(e.kind==='prototype'?.36:.22);
   vx+=-dy/d*wave;vy+=dx/d*wave;
  }else if(e.kind==='heavy'){
   let sx=0,sy=0,neighbors=0;
   const cx=Math.floor(e.x/HASH_CELL),cy=Math.floor(e.y/HASH_CELL);
   for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++){
    const nearby=grid.get(gx+','+gy);if(!nearby)continue;
    for(const other of nearby){if(other===e||other.kind!=='heavy')continue;
     const ox=e.x-other.x,oy=e.y-other.y,dist2=ox*ox+oy*oy;
     if(dist2>1&&dist2<1200){const inv=1/Math.sqrt(dist2);sx+=ox*inv;sy+=oy*inv;neighbors++}
    }
   }if(neighbors){vx+=sx/neighbors*.3;vy+=sy/neighbors*.3}
  }
  const len=Math.max(.001,Math.hypot(vx,vy));vx/=len;vy/=len;
  // Light vehicles briefly hold back to shoot, leaving room to line up a shot.
  const hold=e.kind==='tank'&&d<150;
  if(!hold){const boost=e.kind==='prototype'&&e.dashLeft>0?1.7:1;e.x+=vx*e.speed*dt*boost;e.y+=vy*e.speed*dt*boost;}
  e.view.position.set(e.x,e.y);
  e.animation+=dt*(e.kind==='worker'?4.4:e.kind==='tank'?2.5:e.kind==='light'?8:e.kind==='prototype'?10:e.kind==='heavy'?3.6:1.8);
  if(e.kind==='tank'&&e.hull&&e.turret){
   e.hull.texture=textures.enemyFrames.tank[Math.floor(e.animation+e.seed)%4];
   // Hull follows its travel direction; the weapon independently follows its target.
   const travelHeading=Math.atan2(vy,vx)+Math.PI/2;
   let delta=Math.atan2(Math.sin(travelHeading-e.hullHeading),Math.cos(travelHeading-e.hullHeading));
   e.hullHeading+=clamp(delta,-dt*2.4,dt*2.4);
   e.view.rotation=e.hullHeading;
   e.turret.rotation=Math.atan2(dy,dx)+Math.PI/2-e.hullHeading;
   e.hull.tint=e.turret.tint=0xffffff;
  }else{
   e.view.texture=textures.enemyFrames[e.kind][Math.floor(e.animation+e.seed)%4];
   e.view.rotation=0;e.view.tint=0xffffff;
  }
  e.attack-=dt;e.shotTimer-=dt;
  if(e.kind==='tank'&&e.shotTimer<=0&&d<290){
   enemyProjectile(e,dx,dy,damageScale);e.shotTimer=2.9;
  }
  if(e.kind==='boss'){
   if(e.bossBar){
    const width=68;
    e.bossBar.clear().rect(-width/2,-5,width,6).fill('#12191c')
      .rect(-width/2+1,-4,Math.max(0,(width-2)*e.hp/e.max),4).fill('#d7aa65');
    e.bossBar.position.set(e.x,e.y-62);
   }
   if(e.shotTimer<=0&&e.windup<=0&&d<320){e.windup=.75;e.shotTimer=4.5;}
   if(e.windup>0){
    e.windup-=dt;
    if(e.warning){
     const angle=Math.atan2(dy,dx);const arc=18+(.75-Math.max(0,e.windup))*18;
     e.warning.clear().moveTo(0,0).lineTo(Math.cos(angle-.24)*arc*4,Math.sin(angle-.24)*arc*4)
       .stroke({width:1,color:'#e4a46a',alpha:.40}).moveTo(0,0)
       .lineTo(Math.cos(angle+.24)*arc*4,Math.sin(angle+.24)*arc*4)
       .stroke({width:1,color:'#e4a46a',alpha:.40});
     e.warning.position.set(e.x,e.y);
    }
    if(e.windup<=0){
     e.warning?.clear();
     for(const spread of [-.24,0,.24])enemyProjectile(e,dx,dy,damageScale,spread);
     burst(e.x,e.y-15,false);
    }
   }
  }
  if(d<e.radius+12&&e.attack<=0){
   const spec=EnemyRoster.definitions[e.kind];e.attack=spec.interval;damagePlayer(spec.contact*damageScale);
  }
 }
}

function dropAt(x:number,y:number,kind:'xp'|'salvage',value=1){const view=spr(textures[kind]);view.position.set(x,y);effects.addChild(view);drops.push({x,y,kind,value,view,life:0})}
function particle(x:number,y:number,color:string,power=1){const v=(color==='#596060'||color==='#777e79')?gfxCircle(rand(1.5,3)*power,color):spr(textures.spark);v.tint=(color==='#596060'||color==='#777e79')?0xffffff:color;effects.addChild(v);v.position.set(x,y);const a=rand(0,Math.PI*2),speed=rand(20,90);const duration=rand(.2,.55);v.scale.set(clamp(power*.65,.35,1.7));particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:duration,max:duration,view:v})}
function burst(x:number,y:number,large=false){screenShake=Math.max(screenShake,large?5:2);for(let i=0;i<(large?26:11);i++)particle(x,y,['#ffcc79','#ed8049','#596060','#ffd9a2','#777e79'][i%5],large?1.7:1);const ring=new PIXI.Graphics().circle(0,0,large?18:8).stroke({width:large?3:2,color:'#f6c68d',alpha:.82});ring.position.set(x,y);effects.addChild(ring);particles.push({x,y,vx:0,vy:0,life:.17,max:.17,view:ring})}

// Secondary weapons use a shared data-driven targeting/cooldown system. The main gun is untouched.
const supportKinds:SupportWeapons.Kind[]=['pd','grenade','missile'];
function updateSupportMounts(){if(!supportMounts)return;for(const kind of supportKinds){const mount=supportGraphics[kind];if(mount)mount.visible=supportLevels[kind]>0;}}
function selectSupportEnemy(kind:SupportWeapons.Kind):Enemy|null{
 const target=SupportWeapons.selectTarget(kind,enemies,player,SupportWeapons.definitions[kind].range);
 return target??null;
}
function spawnAux(kind:SupportWeapons.Kind,target:Enemy):void{
 if(auxShots.length>=135)return;
 const spec=SupportWeapons.stats(kind,supportLevels[kind]);
 const angle=Math.atan2(target.y-player.y,target.x-player.x);
 const mount=supportGraphics[kind];
 const from=mount?mount.position:{x:0,y:0};
 // Muzzle is located on a visible shoulder/side hardpoint. These weapons aim independently.
 const x=player.x+from.x+Math.cos(angle)*10,y=player.y+from.y+Math.sin(angle)*10;
 const v=spr(textures[spec.texture]);v.position.set(x,y);v.rotation=angle;effects.addChild(v);
 auxShots.push({kind,x,y,vx:Math.cos(angle)*spec.speed,vy:Math.sin(angle)*spec.speed,
   damage:spec.damage,life:spec.life,radius:spec.radius,view:v,target,hits:new Set()});
 particle(x,y,kind==='pd'?'#ffdc9a':kind==='grenade'?'#ffb76d':'#d4d0aa',.5);
 playSound(kind==='pd'?150:kind==='grenade'?95:210,.05,'triangle',.025);
}
function updateSupportFire(dt:number):void{
 for(const kind of supportKinds){if(supportLevels[kind]<=0)continue;
  supportCooldowns[kind]-=dt;
  if(supportCooldowns[kind]>0)continue;
  const target=selectSupportEnemy(kind);
  if(!target){supportCooldowns[kind]=Math.max(-.1,supportCooldowns[kind]);continue;}
  spawnAux(kind,target);
  supportCooldowns[kind]=SupportWeapons.stats(kind,supportLevels[kind]).cooldown;
 }
}
function damageEnemy(e:Enemy,damage:number,atX:number,atY:number){
 e.hp-=damage;auxHits++;if(e.kind==='boss')bossDamage+=damage;
 particle(atX,atY,'#ffb470',.9);
 if(e.hp<=0){enemyDeath(e);}else if(e.kind==='tank'&&e.hull){e.hull.tint=e.turret.tint=0xffcfaa;}else e.view.tint=0xffcfaa;
}
function explodeAux(x:number,y:number,radius:number,damage:number):void{
 burst(x,y,radius>=52);
 // Splash falloff rewards grouping without instantly erasing heavily armored bosses.
 for(const e of [...enemies]){const d=dist(e.x-x,e.y-y);const edge=d-EnemyRoster.collisionRadius(e.kind);
  if(edge<=radius){const falloff=clamp(1-Math.max(0,edge)/Math.max(1,radius)*.5,.5,1);damageEnemy(e,damage*falloff,x,y);}
 }
}
function updateAuxProjectiles(dt:number):void{
 for(let i=auxShots.length-1;i>=0;i--){const b=auxShots[i];
  if(b.kind==='missile'){
   const target=b.target&&b.target.hp>0?b.target:selectSupportEnemy('missile');b.target=target;
   if(target){const desired=Math.atan2(target.y-b.y,target.x-b.x),current=Math.atan2(b.vy,b.vx);
    const heading=SupportWeapons.turnToward(current,desired,dt*3.8),speed=SupportWeapons.stats('missile',supportLevels.missile).speed;
    b.vx=Math.cos(heading)*speed;b.vy=Math.sin(heading)*speed;b.view.rotation=heading;
   }
   if(Math.random()<dt*18)particle(b.x,b.y,'#777e79',.45);
  }
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.view.position.set(b.x,b.y);
  let impact=false;
  for(const e of enemies){if(b.hits.has(e))continue;
   if(sq(e.x-b.x)+sq(e.y-b.y)<=sq(EnemyRoster.collisionRadius(e.kind)+(b.kind==='grenade'?7:5))){
    if(b.kind==='pd'){b.hits.add(e);damageEnemy(e,b.damage,b.x,b.y);}else{explodeAux(b.x,b.y,b.radius,b.damage);}
    impact=true;break;
   }
  }
  if(!impact&&b.life<=0&&b.kind==='grenade'){explodeAux(b.x,b.y,b.radius,b.damage);impact=true;}
  if(impact||b.life<=0){b.view.destroy();auxShots.splice(i,1);}
 }
}
// The generic firing pipeline consumes the same aiming solution used by sprite selection.
function fireWeapon(def:WeaponKit.WeaponDefinition,solution:WeaponKit.Solution|null):boolean{
 if(!solution)return false;
 const {angle,muzzle,ejection,shotAngles}=solution;
 peakVolley=Math.max(peakVolley,shotAngles.length);
 const stats=weaponStats(def);
 for(const theta of shotAngles){
  const v=spr(textures[def.projectileTexture]);v.rotation=theta;v.position.set(muzzle.x,muzzle.y);effects.addChild(v);
  bullets.push({x:muzzle.x,y:muzzle.y,vx:Math.cos(theta)*stats.speed,vy:Math.sin(theta)*stats.speed,
   damage:stats.damage,life:Math.max(.5,stats.range/stats.speed),view:v,remaining:stats.penetration+1,hits:new Set<Enemy>()});
  shotsFired++;
  if(bullets.length>650){const oldest=bullets.shift()!;oldest.view.destroy()}
 }
 for(let i=0;i<Math.min(3,shotAngles.length);i++)particle(muzzle.x,muzzle.y,'#ffca76',.65);
 for(let i=0;i<2;i++){
  const casing=spr(textures[def.shellTexture]);casing.position.set(ejection.x,ejection.y);effects.addChild(casing);
  const ejectAngle=angle-Math.PI/2+rand(-.25,.25);
  particles.push({x:ejection.x,y:ejection.y,vx:Math.cos(ejectAngle)*rand(20,38),
   vy:Math.sin(ejectAngle)*rand(20,38),life:.32,max:.32,view:casing});
 }
 screenShake=Math.max(screenShake,1.1);playSound(def.soundHz,.035,'sawtooth',.04);
 return true;
}
function fireEquippedWeapons(dt:number):void{
 // Weapon cooldowns stay independent. Continuous guns fire forward whether or
 // not an enemy is present; future tracking weapons can acquire targets.
 for(const def of equippedWeapons){
  let cooldown=(weaponCooldowns.get(def.id)??0)-dt;
  let count=0;
  while(cooldown<=0&&count<6){
   if(!fireWeapon(def,weaponAims.get(def.id)??null)){cooldown=0;break}
   cooldown+=player.fireRate*(def.fireIntervalMultiplier??1);count++;
  }
  weaponCooldowns.set(def.id,count===6?Math.max(0,cooldown):cooldown);
 }
}
function enemyDeath(e:Enemy){
 const spec=EnemyRoster.definitions[e.kind];kills++;
 e.bossBar?.destroy();e.warning?.destroy();
 burst(e.x,e.y,e.kind==='heavy'||e.kind==='prototype'||e.kind==='boss');
 dropAt(e.x,e.y,'xp',spec.xp);
 if(Math.random()<spec.salvage)dropAt(e.x+rand(-6,6),e.y+rand(-6,6),'salvage',e.kind==='boss'?25:e.kind==='prototype'?10:e.kind==='heavy'?3:1);
 const w=spr(textures.wreckTypes[e.kind]);w.position.set(e.x,e.y);w.rotation=rand(-.16,.16);w.scale.set(spec.scale*(textures.wreckTypes[e.kind].width===128?.75:1));
 scene.addChild(w);wrecks.push({x:e.x,y:e.y,view:w,life:e.kind==='boss'?75:rand(18,38)});
 e.view.destroy({children:true});enemies.splice(enemies.indexOf(e),1);
 if(e.kind==='boss')notice('GOLIATH DESTROYED // HIGH VALUE SALVAGE');
}

function levelUp(){level++;xp-=xpNeeded;xpNeeded=Math.floor(xpNeeded*1.38+4);leveling=true;$('upgrade').classList.remove('hidden');const options=[...upgradeCatalog].filter(u=>
 (u.id!=='scatter'||player.multishot<10)&&
 (!u.id.startsWith('unlock-')||supportLevels[u.id.slice(7) as SupportWeapons.Kind]===0)&&
 (!u.id.endsWith('-boost')||supportLevels[u.id.slice(0,-6) as SupportWeapons.Kind]>0)
 ).sort(()=>Math.random()-.5).slice(0,3);
 // Guarantee a visible weapon-unlock choice early enough for the first prototype encounter.
 if(level<=4){const unlock=supportKinds.find(k=>supportLevels[k]===0);
  if(unlock){const chosen=upgradeCatalog.find(u=>u.id==='unlock-'+unlock)!;options[0]=chosen;}}
const node=$('upgrade-options');node.replaceChildren();for(const u of options){const button=document.createElement('button');button.className='card';const title=document.createElement('b');title.textContent=u.name;const desc=document.createElement('span');desc.textContent=u.info;button.append(title,desc);button.onclick=()=>{applyUpgrade(u.id);$('upgrade').classList.add('hidden');leveling=false;if(xp>=xpNeeded)levelUp()};node.appendChild(button)}playSound(680,.17,'sine',.12)}
function applyUpgrade(id:string){
 if(id.startsWith('unlock-')){const kind=id.slice(7) as SupportWeapons.Kind;supportLevels[kind]=Math.max(1,supportLevels[kind]);updateSupportMounts();updateWeaponStats();notice('ONLINE // '+SupportWeapons.definitions[kind].label);return;}
 if(id.endsWith('-boost')){const kind=id.slice(0,-6) as SupportWeapons.Kind;supportLevels[kind]=Math.min(8,supportLevels[kind]+1);updateWeaponStats();notice('UPGRADED // '+SupportWeapons.definitions[kind].label);return;}
 switch(id){
 case 'loading':player.fireRate=Math.max(.045,player.fireRate*.78);break;
 case 'overclock':player.fireRate=Math.max(.045,player.fireRate*.68);player.damage*=.9;break;
 case 'ammo':player.damage*=1.35;break;
 case 'barrel':player.bulletSpeed*=1.2;player.range+=40;break;
 case 'armor':player.max+=25;player.hp=Math.min(player.max,player.hp+25);break;
 case 'servo':player.speed*=1.15;break;
 case 'targeting':player.fireRate=Math.max(.045,player.fireRate*.88);player.range+=60;break;
 case 'pickup':player.magnet+=28;break;
 case 'scatter':player.multishot=Math.min(10,player.multishot+1);break;
 case 'cluster':player.spreadAngle=Math.max(.018,player.spreadAngle*.75);break;
 case 'pierce':player.penetration=Math.min(8,player.penetration+1);break;
 case 'stabilizer':player.fireRate=Math.max(.045,player.fireRate*.85);player.bulletSpeed*=1.1;break;
 }updateWeaponStats();notice('INSTALLED // '+id.toUpperCase())}
function updateWeaponStats(){const rounds=player.multishot/player.fireRate;peakProjectilesPerSecond=Math.max(peakProjectilesPerSecond,rounds);
 $('weapon-rate').textContent=(1/player.fireRate).toFixed(1)+' volleys/s';
 $('weapon-multi').textContent=String(player.multishot);
 $('weapon-pierce').textContent=String(player.penetration);
 $('weapon-output').textContent=rounds.toFixed(1)+' rounds/s';
 const aux=$('support-status');aux.textContent=supportKinds.filter(k=>supportLevels[k]>0).map(k=>SupportWeapons.definitions[k].short+' '+supportLevels[k]).join(' · ')||'SECONDARIES: NONE';}

function notice(s:string){$('notice').textContent=s;noticeUntil=elapsed+2.5}
function damagePlayer(n:number){if(dead)return;const applied=Math.max(1,n-player.armor);recentDamage=Math.min(90,recentDamage+applied);player.hp=Math.max(0,player.hp-applied);hitFlash=.22;screenShake=5;playSound(130,.14,'square',.09);if(player.hp<=0)gameOver()}
function gameOver(){dead=true;playing=false;leveling=false;$('upgrade').classList.add('hidden');permanentSalvage+=salvageRun;save();$('end-stats').textContent=`Survived ${formatTime(elapsed)} · ${kills} kills · ${salvageRun} salvage recovered.\n${shotsFired} primary rounds · ${auxHits} secondary hits · ${Math.floor(bossDamage)} boss damage.\nPeak ${peakProjectilesPerSecond.toFixed(1)} primary rounds/s · ${peakVolley} projectiles/volley.\nRecovered salvage is available in the hangar.`;$('end').classList.remove('hidden')}
function formatTime(t:number){return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`}
function updateHUD(){$('health-label').textContent=`${Math.ceil(player.hp)} / ${player.max}`;$('health-fill').style.width=`${100*player.hp/player.max}%`;$('xp-fill').style.width=`${100*xp/xpNeeded}%`;$('level-label').textContent=`LVL ${level}`;$('kills').textContent=String(kills);$('salvage').textContent=String(salvageRun);$('time').textContent=formatTime(elapsed)}
function save(){localStorage.setItem('ironwake_salvage',String(permanentSalvage));localStorage.setItem('ironwake_armor',String(armorOwned))}
function openHangar(fromGame=false){hangarFromGame=fromGame;$('end').classList.add('hidden');$('menu').classList.add('hidden');$('upgrade').classList.add('hidden');$('hangar-salvage').textContent=String(permanentSalvage);$('armor-status').textContent=armorOwned?'REINFORCED':'STANDARD';const button=$('buy-armor') as HTMLButtonElement;button.disabled=armorOwned||permanentSalvage<30;button.textContent=armorOwned?'REINFORCED ARMOR INSTALLED':'INSTALL REINFORCED ARMOR — 30 SALVAGE';renderPreview();$('hangar').classList.remove('hidden')}
let audioContext:AudioContext|null=null,muted=false;
function playSound(freq:number,duration:number,type:OscillatorType='sine',gain=.08){if(muted)return;try{audioContext??=new AudioContext();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration)}catch{}}
function startRun(){reset();$('menu').classList.add('hidden');$('end').classList.add('hidden');$('hangar').classList.add('hidden');playing=true;boopTimer=1.15;notice('SYSTEMS INITIALIZING // IRON DISTRICT');playSound(170,.16,'triangle',.06)}
function tick(dt:number){if(!playing||paused||leveling||!$('hangar').classList.contains('hidden'))return;
 dt=Math.min(dt,.05);
 if(boopTimer>0){boopTimer-=dt;if(boopTimer<=0){coreEye.visible=true;playSound(880,.095,'sine',.16);notice('● OPTICAL ONLINE // WEAPONS FREE')}camera();return}
 elapsed+=dt;
 let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'))+touchMove.x,dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'))+touchMove.y;
 const mag=dist(dx,dy);
 if(mag>.08){
  dx/=Math.max(1,mag);dy/=Math.max(1,mag);
  player.x+=dx*player.speed*dt;player.y+=dy*player.speed*dt;
  walkElapsed+=dt*8.5;facingLower=directionFor(dx,dy);
 }else{walkElapsed=0}
 const gaitFrame=mag>.08?Math.floor(walkElapsed)%4:0;
 // Single complete-body frame eliminates the mismatched waist and duplicate rifle.
 mech.position.set(player.x,player.y);
 hitFlash=Math.max(0,hitFlash-dt);
 fullSprite.tint=hitFlash>0?0xff7777:0xffffff;
 if(aimLane){aimLane.position.set(player.x,player.y);aimLane.rotation=-facingLower*Math.PI/4;}
 updateWeaponAiming();
 updateSpawnDirector(dt);
 fireEquippedWeapons(dt);
 updateSupportFire(dt);
 // Pose follows chassis direction with no broken torso / leg seam.
 syncBastionPose(gaitFrame,visualFacing);
 coreEye.visible=boopTimer<=0&&(visualFacing===0||visualFacing===1||visualFacing===7);
 moveEnemies(dt);
 updateAuxProjectiles(dt);
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.view.position.set(b.x,b.y);let destroyed=false;
 for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(b.hits.has(e))continue;if(sq(e.x-b.x)+sq(e.y-b.y)<sq(EnemyRoster.collisionRadius(e.kind)+3)){
  b.hits.add(e);e.hp-=b.damage;particle(b.x,b.y,'#ffa66b');if(e.hp<=0)enemyDeath(e);else if(e.kind==='tank'&&e.hull){e.hull.tint=e.turret.tint=0xffd5aa;}else e.view.tint=0xffd5aa;
  b.remaining--;if(b.remaining<=0){destroyed=true;break}
 }}
 if(destroyed||b.life<=0){b.view.destroy();bullets.splice(i,1)}}
 for(let i=hostileShots.length-1;i>=0;i--){
  const b=hostileShots[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.view.position.set(b.x,b.y);
  if(sq(b.x-player.x)+sq(b.y-player.y)<sq(14)||b.life<=0){
   if(b.life>0)damagePlayer(b.damage);b.view.destroy();hostileShots.splice(i,1);
  }
 }
 for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.life+=dt;const dd=dist(player.x-d.x,player.y-d.y);if(dd<player.magnet){d.x+=(player.x-d.x)*Math.min(1,dt*7);d.y+=(player.y-d.y)*Math.min(1,dt*7);d.view.position.set(d.x,d.y)}d.view.scale.set(1+Math.sin(d.life*6)*.12);if(dd<13){if(d.kind==='xp'){xp+=d.value;if(xp>=xpNeeded&&!leveling)levelUp()}else{salvageRun+=d.value;playSound(420,.06,'sine',.03)}d.view.destroy();drops.splice(i,1)}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.view.position.set(p.x,p.y);p.view.alpha=clamp(p.life/p.max,0,1);if(p.life<=0){p.view.destroy();particles.splice(i,1)}}
 for(let i=wrecks.length-1;i>=0;i--){const w=wrecks[i];w.life-=dt;w.view.alpha=Math.min(1,w.life/4);if(w.life<=0){w.view.destroy();wrecks.splice(i,1)}}
 if(noticeUntil<elapsed)$('notice').textContent='';updateHUD();if(!$('director-panel').classList.contains('hidden'))updateDirectorReadout();camera();}
function camera(){const sx=rand(-screenShake,screenShake),sy=rand(-screenShake,screenShake);screenShake*=.83;world.position.set(W/2-player.x+sx,H/2-player.y+sy);const cx=Math.floor(player.x/128),cy=Math.floor(player.y/128);let i=0;for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){const t=ground.children[i++];const tx=cx+x,ty=cy+y;t.position.set(tx*128,ty*128);const next=textures.tiles[tileVariant(tx,ty)];if(t.texture!==next)t.texture=next}}

function toggleDirectorPanel(){const panel=$('director-panel');panel.classList.toggle('hidden');}
function setupDirectorUI(){
 const options:[string,keyof ThreatDirector.Tuning,number,number,number][]=[
  ['Spawn intensity','intensity',.35,2.5,.05],['Enemy health','hp',.5,2.5,.05],
  ['Enemy damage','damage',.3,2.5,.05],['Enemy speed','speed',.5,1.8,.05],
  ['Mule / Wardog weight','scout',0,3,.1],['Light Suit weight','raider',0,3,.1],['Heavy Suit weight','brute',0,3,.1]
 ];
 const node=$('director-controls');node.replaceChildren();
 const preset=$('director-preset') as HTMLSelectElement;preset.value=directorTuning.preset;
 preset.onchange=()=>{directorTuning.preset=preset.value as ThreatDirector.Preset;updateDirectorReadout()};
 for(const [label,key,min,max,step] of options){
  const row=document.createElement('label');row.className='director-row';
  const title=document.createElement('span');title.textContent=label;
  const value=document.createElement('output');value.textContent=String(directorTuning[key]);
  const slider=document.createElement('input');slider.type='range';slider.min=String(min);slider.max=String(max);slider.step=String(step);slider.value=String(directorTuning[key]);
  slider.oninput=()=>{(directorTuning as any)[key]=Number(slider.value);value.textContent=Number(slider.value).toFixed(2);updateDirectorReadout()};
  row.append(title,value,slider);node.appendChild(row);
 }
 const assist=$('director-assist') as HTMLInputElement;assist.checked=directorTuning.assist;assist.onchange=()=>{directorTuning.assist=assist.checked};
 $('director-toggle').onclick=toggleDirectorPanel;$('director-close').onclick=toggleDirectorPanel;
 $('director-reset').onclick=()=>{directorTuning={...ThreatDirector.defaults};setupDirectorUI();updateDirectorReadout()};
 updateDirectorReadout();
}
function updateDirectorReadout(){
 $('director-stats').textContent=`Threat ${ThreatDirector.threat(elapsed,directorTuning).toFixed(1)} · Enemy cap ${ThreatDirector.cap(elapsed,directorTuning)} · Current ${enemies.length} · Boss ${Math.max(0,Math.ceil((EnemyRoster.bossInterval-elapsed%EnemyRoster.bossInterval)/60))} min`;
}

// Camera zoom is a presentation setting only: no changes to speed, physics or collisions.
const isTouchViewport=()=>window.matchMedia('(pointer: coarse)').matches || window.innerWidth<=720;
const zoomStops=[1.45,1.7,1.95,2.2,2.5,2.8,3.0];
const storedZoom=Number(localStorage.getItem('ironwake_mobile_zoom'));
let mobileZoom=zoomStops.includes(storedZoom)?storedZoom:1.95;
function cameraDivisor(){return isTouchViewport()?mobileZoom:3}
function resizeCamera(){W=Math.max(160,Math.round(window.innerWidth/cameraDivisor()));H=Math.max(120,Math.round(window.innerHeight/cameraDivisor()));app.renderer.resize(W,H);camera()}
function setMobileZoom(change:number){
 const index=zoomStops.indexOf(mobileZoom);
 mobileZoom=zoomStops[clamp(index+change,0,zoomStops.length-1)];
 localStorage.setItem('ironwake_mobile_zoom',String(mobileZoom));
 resizeCamera();
 const label=document.getElementById('zoom-value');if(label)label.textContent=Math.round(3/mobileZoom*100)+'% VIEW';
}

async function init(){
 const startButton=$('start') as HTMLButtonElement;
 startButton.disabled=true;
 startButton.textContent='PREPARING COMBAT SYSTEMS…';
 $('menu').querySelector('p')!.textContent='FIRST DEPLOYMENT // INITIALIZING';
 W=Math.max(160,Math.round(window.innerWidth/cameraDivisor()));H=Math.max(120,Math.round(window.innerHeight/cameraDivisor()));app=new PIXI.Application();await app.init({width:W,height:H,background:'#202b2d',antialias:false,resolution:1,autoDensity:false,preference:'webgl'});app.canvas.style.width='100%';app.canvas.style.height='100%';app.canvas.style.imageRendering='pixelated';$('game').appendChild(app.canvas);
 WeaponKit.validateDefinition(WeaponKit.bastionAutocannon);for(const k of supportKinds)SupportWeapons.validate(SupportWeapons.definitions[k]);makeTextures();await Promise.all([buildBastionAtlas(),buildCarrionAtlas()]);world=new PIXI.Container();app.stage.addChild(world);createTileScene();makeMech();mech.position.set(0,0);camera();renderPreview();app.ticker.add((ticker:any)=>tick(ticker.deltaMS/1000));
 startButton.onclick=()=>{try{startRun()}catch(error){console.error('Deployment failed',error);$('menu').classList.remove('hidden');$('menu').querySelector('p')!.textContent='DEPLOYMENT ERROR // '+String(error);}};
 startButton.disabled=false;startButton.textContent='INITIATE DEPLOYMENT ●';
 $('menu').querySelector('p')!.textContent='FIRST DEPLOYMENT // READY';
 window.addEventListener('resize',resizeCamera);
 $('zoom-out').onclick=()=>setMobileZoom(-1);$('zoom-in').onclick=()=>setMobileZoom(1);
 $('zoom-value').textContent=Math.round(3/mobileZoom*100)+'% VIEW';
 try{setupDirectorUI()}catch(error){console.warn('Difficulty panel unavailable; combat remains playable',error);$('director-toggle').style.display='none'}$('retry').onclick=startRun;$('hangar-open').onclick=()=>openHangar(false);$('end-hangar').onclick=()=>openHangar(false);$('hangar-close').onclick=()=>{$('hangar').classList.add('hidden');if(armorOwned)armorOverlay.visible=true;if(dead){$('end').classList.remove('hidden')}else if(!playing){$('menu').classList.remove('hidden')}else{paused=false}};$('buy-armor').onclick=()=>{if(!armorOwned&&permanentSalvage>=30){armorOwned=true;permanentSalvage-=30;save();syncBastionPose(0,facingLower);openHangar(hangarFromGame);$('hangar-message').textContent='REINFORCED ARMOR INSTALLED // VISIBLE IN COMBAT. +35 MAX ARMOR.';playSound(310,.2,'triangle',.12)}};
 window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='p'&&playing){paused=!paused;notice(paused?'PAUSED':'RESUMED')}if(k==='h'&&playing&&!leveling){if($('hangar').classList.contains('hidden')){paused=true;openHangar(true)}else{($('hangar-close') as HTMLButtonElement).click()}}if(k==='m')muted=!muted;if(k==='f3'){e.preventDefault();toggleDirectorPanel()}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
 const ring=$('touch').querySelector('.touch-ring') as HTMLElement,stick=$('touch-stick');function moveTouch(e:PointerEvent){const r=ring.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.max(1,dist(x,y)),s=Math.min(1,d/43);touchMove={x:x/d*s,y:y/d*s};stick.style.transform=`translate(${touchMove.x*33}px,${touchMove.y*33}px)`}ring.addEventListener('pointerdown',e=>{ring.setPointerCapture(e.pointerId);moveTouch(e)});ring.addEventListener('pointermove',e=>{if(ring.hasPointerCapture(e.pointerId))moveTouch(e)});function stopTouch(){touchMove={x:0,y:0};stick.style.transform='none'}ring.addEventListener('pointerup',stopTouch);ring.addEventListener('pointercancel',stopTouch);
}
init().catch(e=>{console.error(e);$('menu').querySelector('p')!.textContent='Unable to initialize graphics. Check PixiJS CDN, sprite assets and WebGL availability.'});