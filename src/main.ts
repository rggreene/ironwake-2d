/* IRONWAKE // First Deployment. PixiJS 8 browser POC. v0.5 production atlas: 8-direction Bastion artwork with independent upper and lower facing. */
declare const PIXI: any;

type EnemyKind = 'scout' | 'raider' | 'brute';
type Enemy = { x:number;y:number;hp:number;max:number;speed:number;radius:number;kind:EnemyKind;view:any;attack:number;seed:number };
type Bullet = {x:number;y:number;vx:number;vy:number;damage:number;life:number;view:any;remaining:number;hits:Set<Enemy>};
type Drop = {x:number;y:number;kind:'xp'|'salvage';value:number;view:any;life:number};
type Particle = {x:number;y:number;vx:number;vy:number;life:number;max:number;view:any};
type Wreck = {x:number;y:number;view:any;life:number};
type Upgrade = {id:string;name:string;info:string};
const $ = (id:string):HTMLElement => {const v=document.getElementById(id);if(!v)throw new Error('Missing UI '+id);return v};
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const rand=(a:number,b:number)=>a+Math.random()*(b-a);
const sq=(x:number)=>x*x;
const dist=(x:number,y:number)=>Math.sqrt(sq(x)+sq(y));
const palette={armor:'#69785c',light:'#96a188',shadow:'#39483e',metal:'#222c30',dark:'#131b20',accent:'#d3a25e',red:'#fd392f',glass:'#162731'};
let app:any,world:any,ground:any,entities:any,effects:any,scene:any;
let W=640,H=360,last=0,elapsed=0,spawnClock=0,fireClock=0,screenShake=0,noticeUntil=0,paused=false,playing=false,leveling=false,dead=false,hangarFromGame=false,boopTimer=0;
let kills=0,xp=0,level=1,salvageRun=0,xpNeeded=14,hitFlash=0,shotsFired=0,peakProjectilesPerSecond=0,peakVolley=1;
let permanentSalvage=Number(localStorage.getItem('ironwake_salvage')||0),armorOwned=localStorage.getItem('ironwake_armor')==='true';
let player={x:0,y:0,hp:120,max:120,speed:94,angle:0,fireRate:0.52,damage:18,bulletSpeed:320,range:280,multishot:1,spreadAngle:.085,penetration:0,armor:0,magnet:28,movePhase:0};
const enemies:Enemy[]=[];const bullets:Bullet[]=[];const drops:Drop[]=[];const particles:Particle[]=[];const wrecks:Wreck[]=[];
let mech:any,body:any,torso:any,legs:any,leftLeg:any,rightLeg:any,leftArm:any,rightArm:any,gun:any,coreEye:any,armorOverlay:any;
const keys=new Set<string>();
let touchMove={x:0,y:0};
const upgradeCatalog:Upgrade[]=[
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
// The official 4-row x 8-column illustrated Bastion atlas. Columns: S, SE, E, NE, N, NW, W, SW.
// Rows: idle, left step, right step, recovery. Torso and legs are cropped and can face separately.
const BASTION_ATLAS_URL = 'assets/mechs/bastion/full_64.png';
const BASTION_W = 64, BASTION_H = 96;
let upperFrames:any[][]=[], lowerFrames:any[][]=[], armorFrames:any[][]=[];
let upperSprite:any, lowerSprite:any, mechShadow:any;
let facingLower=0, facingUpper=0, recoilKick=0, walkElapsed=0;
const directionFor=(dx:number,dy:number)=>((Math.round(Math.atan2(dx,dy)/(Math.PI/4))+8)%8);
async function buildBastionAtlas(){
 const image=new Image();image.src=BASTION_ATLAS_URL;
 await image.decode();
 if(image.naturalWidth!==BASTION_W*8 || image.naturalHeight!==BASTION_H*4) throw new Error('Bastion atlas frame grid mismatch');
 upperFrames=[];lowerFrames=[];armorFrames=[];
 for(let row=0;row<4;row++){
  const up:any[]=[],low:any[]=[],arm:any[]=[];
  for(let dir=0;dir<8;dir++){
   const px=dir*BASTION_W,py=row*BASTION_H;
   // At the waist the frames overlap slightly: avoids seams when the torso tracks a different target.
   const upper=tex(BASTION_W,BASTION_H,c=>c.drawImage(image,px,py,BASTION_W,62,0,0,BASTION_W,62));
   const lower=tex(BASTION_W,BASTION_H,c=>c.drawImage(image,px,py+47,BASTION_W,BASTION_H-47,0,47,BASTION_W,BASTION_H-47));
   const armored=tex(BASTION_W,BASTION_H,c=>{
    c.drawImage(image,px,py,BASTION_W,62,0,0,BASTION_W,62);
    // Subtle installed composite plates without hiding the original Bastion head and rifle.
    const left=dir===2||dir===3?12:dir===6||dir===5?17:13;
    rect(c,left,29,9,9,'#36433b');rect(c,left+1,29,7,6,'#a3ad91');
    rect(c,BASTION_W-left-9,29,9,9,'#36433b');rect(c,BASTION_W-left-8,29,7,6,'#a3ad91');
    rect(c,27,38,11,7,'#283932');rect(c,28,39,9,5,'#a2b095');
   });
   up.push(upper);low.push(lower);arm.push(armored);
  }
  upperFrames.push(up);lowerFrames.push(low);armorFrames.push(arm);
 }
}
function syncBastionPose(frame:number,upperDir:number,lowerDir:number){
 if(!upperSprite||!lowerSprite)return;
 upperSprite.texture=(armorOwned?armorFrames:upperFrames)[frame][upperDir];
 lowerSprite.texture=lowerFrames[frame][lowerDir];
}
const textures:any={};
function makeTextures(){textures.hip=drawBastionPart('hip');textures.leftLeg=drawBastionPart('leftLeg');textures.rightLeg=drawBastionPart('rightLeg');textures.torso=drawBastionPart('torso');textures.leftArm=drawBastionPart('leftArm');textures.rightArm=drawBastionPart('rightArm');textures.gun=drawBastionPart('gun');textures.armor=drawBastionPart('armor');textures.eye=drawBastionPart('eye');
 textures.scout=tex(26,26,c=>{rect(c,5,8,16,11,'#915e47');rect(c,8,4,10,19,'#53483c');rect(c,10,6,6,15,'#b07f56');rect(c,2,11,5,5,'#bd9b62');rect(c,19,11,5,5,'#bd9b62');rect(c,11,2,4,6,'#d0a774')});
 textures.raider=tex(32,32,c=>{rect(c,5,9,22,17,'#6c6561');rect(c,9,5,14,22,'#363e43');rect(c,12,8,8,19,'#9f7460');rect(c,3,11,5,10,'#232c32');rect(c,24,11,5,10,'#232c32');rect(c,11,2,10,5,'#655453');rect(c,14,4,4,4,'#cc8455')});
 textures.brute=tex(42,42,c=>{rect(c,5,9,32,27,'#352d2e');rect(c,8,7,26,29,'#775344');rect(c,12,11,18,18,'#4c393a');rect(c,13,8,16,7,'#c28c55');rect(c,3,17,7,13,'#3c4143');rect(c,32,17,7,13,'#3c4143');rect(c,12,33,7,7,'#2c3034');rect(c,23,33,7,7,'#2c3034');rect(c,18,3,6,7,'#c49c71')});
 textures.xp=tex(10,10,c=>{rect(c,3,0,4,2,'#b9faff');rect(c,1,2,8,6,'#287993');rect(c,3,3,4,4,'#a7edee');rect(c,3,8,4,2,'#5ab4ce')});
 textures.salvage=tex(12,12,c=>{rect(c,2,2,8,8,'#b38550');rect(c,4,4,4,4,'#f0c778');rect(c,1,5,10,2,'#786344')});
 textures.bullet=tex(10,5,c=>{rect(c,0,1,8,3,'#d4a96b');rect(c,7,0,3,5,'#fff2ba')});
 textures.shell=tex(5,3,c=>{rect(c,0,0,5,3,'#be995b');rect(c,1,0,2,1,'#ffe1a1')});
 textures.spark=tex(5,5,c=>{rect(c,1,0,3,5,'#ffad63');rect(c,0,1,5,3,'#ffd8a0')});
 textures.wreck=tex(28,28,c=>{rect(c,5,7,20,18,'#2b2928');rect(c,7,6,15,18,'#4f3b30');rect(c,9,11,12,8,'#1c2426');rect(c,3,17,5,6,'#423b36');rect(c,20,18,7,6,'#423b36');rect(c,13,13,5,4,'#b56838')});
 textures.tile=tex(128,128,c=>{rect(c,0,0,128,128,'#31383a');for(let y=0;y<128;y+=32){for(let x=0;x<128;x+=32){const v=((x*71+y*31)%7);rect(c,x,y,32,1,'#485052');rect(c,x,y,1,32,'#42494c');if(v<3)rect(c,x+8,y+14,4,2,'#414747');if(v===4)rect(c,x+26,y+7,2,7,'#292e31')}}rect(c,80,0,18,128,'#3b4240');for(let y=10;y<128;y+=24)rect(c,87,y,3,8,'#8b86685a');rect(c,0,105,128,2,'#665943')});
}
function makeMech(){
 mech=new PIXI.Container();
 mechShadow=new PIXI.Graphics().ellipse(0,34,24,8).fill({color:'#080d0d',alpha:.48});
 lowerSprite=spr(lowerFrames[0][0]);upperSprite=spr(upperFrames[0][0]);
 // Upper and lower both use the same world-space pivot, not a rotating tank turret.
 lowerSprite.scale.set(1.08);upperSprite.scale.set(1.08);
 // Dedicated red optical indicator; keep the beloved startup BOOP.
 coreEye=new PIXI.Graphics().circle(0,0,1.9).fill('#ff3434');
 coreEye.position.set(0,-26);coreEye.visible=false;
 // Keep legacy module references inert: the visual upgrade is no longer a procedural chassis.
 legs=lowerSprite;torso=upperSprite;body=upperSprite;gun={y:0};
 leftLeg={y:0,rotation:0};rightLeg={y:0,rotation:0};armorOverlay={visible:false};
 mech.addChild(mechShadow,lowerSprite,upperSprite,coreEye);
 entities.addChild(mech);return mech;
}
function renderPreview(){
 const holder=$('mech-preview');holder.replaceChildren();
 const cv=pixelCanvas(192,192,c=>{
  c.imageSmoothingEnabled=false;
  const upper=(armorOwned?armorFrames:upperFrames)[0][0].__sourceCanvas;
  const lower=lowerFrames[0][0].__sourceCanvas;
  c.drawImage(lower,40,0,112,168);c.drawImage(upper,40,0,112,168);
  rect(c,94,44,4,4,'#fd392f');
 });
 cv.style.width='235px';cv.style.height='235px';cv.style.imageRendering='pixelated';holder.appendChild(cv)
}
function createTileScene(){ground=new PIXI.Container();world.addChild(ground);for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){const tile=spr(textures.tile,0);tile.x=x*128;tile.y=y*128;ground.addChild(tile)}
 const rng=(()=>{let z=9876543;return()=>{z=(1664525*z+1013904223)>>>0;return z/4294967296}})();
 const g=new PIXI.Graphics();for(let i=0;i<170;i++){const x=(rng()-.5)*3600,y=(rng()-.5)*3600;const k=rng();if(k<.55){g.rect(x,y,rng()*8+4,1.5).fill('#65615a')}else if(k<.84){g.rect(x,y,14,6).fill('#3b4444');g.rect(x+2,y+2,10,1).fill('#65716c')}else{g.circle(x,y,5+rng()*11).fill({color:'#252c2e',alpha:.7})}}ground.addChild(g);
 scene=new PIXI.Container();world.addChild(scene);entities=new PIXI.Container();effects=new PIXI.Container();world.addChild(entities,effects);
}
function reset(){for(const group of [enemies,bullets,drops,particles,wrecks]){for(const item of group as any[])item.view?.destroy();group.length=0}
 player={x:0,y:0,hp:armorOwned?155:120,max:armorOwned?155:120,speed:94,angle:0,fireRate:.52,damage:18,bulletSpeed:320,range:280,multishot:1,spreadAngle:.085,penetration:0,armor:armorOwned?2:0,magnet:28,movePhase:0};
 elapsed=spawnClock=fireClock=screenShake=0;kills=xp=salvageRun=shotsFired=peakProjectilesPerSecond=0;peakVolley=1;level=1;xpNeeded=14;leveling=dead=false;paused=false;mech.position.set(0,0);coreEye.visible=false;facingLower=0;facingUpper=0;recoilKick=0;walkElapsed=0;
 syncBastionPose(0,0,0);upperSprite.position.set(0,0);updateHUD();updateWeaponStats();}
function spawnEnemy(){const danger=1+elapsed/60;const kind:EnemyKind=elapsed>58&&Math.random()<.12?'brute':elapsed>18&&Math.random()<.3?'raider':'scout';const angle=rand(0,Math.PI*2),r=Math.max(W,H)/2+65;const x=player.x+Math.cos(angle)*r,y=player.y+Math.sin(angle)*r;
 const stats=kind==='scout'?[28,45,9]:kind==='raider'?[65,29,13]:[155,18,18];const hp=stats[0]*(1+elapsed/250),view=spr(textures[kind]);view.position.set(x,y);view.rotation=rand(-.3,.3);entities.addChild(view);enemies.push({x,y,hp,max:hp,speed:stats[1]*(1+elapsed/450),radius:stats[2],kind,view,attack:0,seed:rand(0,10)})}
function dropAt(x:number,y:number,kind:'xp'|'salvage',value=1){const view=spr(textures[kind]);view.position.set(x,y);effects.addChild(view);drops.push({x,y,kind,value,view,life:0})}
function particle(x:number,y:number,color:string,power=1){const v=gfxCircle(rand(.7,1.8)*power,color);effects.addChild(v);v.position.set(x,y);const a=rand(0,Math.PI*2),speed=rand(20,90);particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:rand(.2,.55),max:.55,view:v})}
function burst(x:number,y:number,large=false){screenShake=Math.max(screenShake,large?5:2);for(let i=0;i<(large?20:8);i++)particle(x,y,['#ffcc79','#ed8049','#596060','#ffd9a2'][i%4],large?1.5:1);const ring=new PIXI.Graphics().circle(0,0,large?12:6).stroke({width:2,color:'#f6c68d'});ring.position.set(x,y);effects.addChild(ring);particles.push({x,y,vx:0,vy:0,life:.17,max:.17,view:ring})}
function fire(){let closest:Enemy|undefined,dd=sq(player.range);for(const enemy of enemies){const d=sq(enemy.x-player.x)+sq(enemy.y-player.y);if(d<dd){closest=enemy;dd=d}}if(!closest)return;
 const a=Math.atan2(closest.y-player.y,closest.x-player.x);player.angle=a+Math.PI/2;facingUpper=directionFor(Math.cos(a),Math.sin(a));recoilKick=3.5;
 const num=player.multishot;peakVolley=Math.max(peakVolley,num);
 for(let i=0;i<num;i++){
  const offset=i-(num-1)/2,theta=a+offset*player.spreadAngle;
  const x=player.x+Math.cos(theta)*38-Math.sin(theta)*14,y=player.y+Math.sin(theta)*38+Math.cos(theta)*14;
  const v=spr(textures.bullet);v.rotation=theta;v.position.set(x,y);effects.addChild(v);
  bullets.push({x,y,vx:Math.cos(theta)*player.bulletSpeed,vy:Math.sin(theta)*player.bulletSpeed,damage:player.damage,life:Math.max(0.5,player.range/player.bulletSpeed),view:v,remaining:player.penetration+1,hits:new Set<Enemy>()});
  shotsFired++;
  if(bullets.length>650){const oldest=bullets.shift()!;oldest.view.destroy()}
 }
 for(let i=0;i<Math.min(3,num);i++)particle(player.x+Math.cos(a)*36-Math.sin(a)*10,player.y+Math.sin(a)*36+Math.cos(a)*10,'#ffca76',.65);
 for(let i=0;i<2;i++){const s=spr(textures.shell);const cx=player.x+Math.cos(a)*8+Math.sin(a)*22,cy=player.y+Math.sin(a)*8-Math.cos(a)*22;s.position.set(cx,cy);effects.addChild(s);const aa=a-Math.PI/2+rand(-.25,.25);particles.push({x:cx,y:cy,vx:Math.cos(aa)*rand(20,38),vy:Math.sin(aa)*rand(20,38),life:.32,max:.32,view:s})}
 screenShake=Math.max(screenShake,1.1);playSound(70,.035,'sawtooth',.04);
}
function enemyDeath(e:Enemy){kills++;burst(e.x,e.y,e.kind==='brute');dropAt(e.x,e.y,'xp',e.kind==='brute'?6:e.kind==='raider'?3:1);if(Math.random()<(e.kind==='brute'?.8:.17))dropAt(e.x+rand(-6,6),e.y+rand(-6,6),'salvage',e.kind==='brute'?3:1);
 const w=spr(textures.wreck);w.position.set(e.x,e.y);w.rotation=rand(-3.14,3.14);scene.addChild(w);wrecks.push({x:e.x,y:e.y,view:w,life:rand(18,38)});
 e.view.destroy();enemies.splice(enemies.indexOf(e),1)}
function levelUp(){level++;xp-=xpNeeded;xpNeeded=Math.floor(xpNeeded*1.38+4);leveling=true;$('upgrade').classList.remove('hidden');const options=[...upgradeCatalog].filter(u=>u.id!=='scatter'||player.multishot<10).sort(()=>Math.random()-.5).slice(0,3);const node=$('upgrade-options');node.replaceChildren();for(const u of options){const button=document.createElement('button');button.className='card';const title=document.createElement('b');title.textContent=u.name;const desc=document.createElement('span');desc.textContent=u.info;button.append(title,desc);button.onclick=()=>{applyUpgrade(u.id);$('upgrade').classList.add('hidden');leveling=false;if(xp>=xpNeeded)levelUp()};node.appendChild(button)}playSound(680,.17,'sine',.12)}
function applyUpgrade(id:string){switch(id){
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
 $('weapon-output').textContent=rounds.toFixed(1)+' rounds/s';}

function notice(s:string){$('notice').textContent=s;noticeUntil=elapsed+2.5}
function damagePlayer(n:number){if(dead)return;player.hp=Math.max(0,player.hp-Math.max(1,n-player.armor));hitFlash=.22;screenShake=5;playSound(130,.14,'square',.09);if(player.hp<=0)gameOver()}
function gameOver(){dead=true;playing=false;leveling=false;$('upgrade').classList.add('hidden');permanentSalvage+=salvageRun;save();$('end-stats').textContent=`Survived ${formatTime(elapsed)} · ${kills} kills · ${salvageRun} salvage recovered.\n${shotsFired} rounds fired · peak ${peakProjectilesPerSecond.toFixed(1)} rounds/s · ${peakVolley} projectiles/volley.\nRecovered salvage is available in the hangar.`;$('end').classList.remove('hidden')}
function formatTime(t:number){return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`}
function updateHUD(){$('health-label').textContent=`${Math.ceil(player.hp)} / ${player.max}`;$('health-fill').style.width=`${100*player.hp/player.max}%`;$('xp-fill').style.width=`${100*xp/xpNeeded}%`;$('level-label').textContent=`LVL ${level}`;$('kills').textContent=String(kills);$('salvage').textContent=String(salvageRun);$('time').textContent=formatTime(elapsed)}
function save(){localStorage.setItem('ironwake_salvage',String(permanentSalvage));localStorage.setItem('ironwake_armor',String(armorOwned))}
function openHangar(fromGame=false){hangarFromGame=fromGame;$('end').classList.add('hidden');$('menu').classList.add('hidden');$('upgrade').classList.add('hidden');$('hangar-salvage').textContent=String(permanentSalvage);$('armor-status').textContent=armorOwned?'REINFORCED':'STANDARD';const button=$('buy-armor') as HTMLButtonElement;button.disabled=armorOwned||permanentSalvage<30;button.textContent=armorOwned?'REINFORCED ARMOR INSTALLED':'INSTALL REINFORCED ARMOR — 30 SALVAGE';renderPreview();$('hangar').classList.remove('hidden')}
let audioContext:AudioContext|null=null,muted=false;
function playSound(freq:number,duration:number,type:OscillatorType='sine',gain=.08){if(muted)return;try{audioContext??=new AudioContext();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration)}catch{}}
function startRun(){reset();$('menu').classList.add('hidden');$('end').classList.add('hidden');$('hangar').classList.add('hidden');playing=true;boopTimer=1.15;notice('SYSTEMS INITIALIZING');playSound(170,.16,'triangle',.06)}
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
 // The chassis faces the direction of travel; upper body faces the auto-acquired target.
 // Unlike v0.3/v0.4, these are distinct illustrated orientations, never rotated rectangles.
 syncBastionPose(gaitFrame,facingUpper,facingLower);
 coreEye.visible=boopTimer<=0&&(facingUpper===0||facingUpper===1||facingUpper===7);
 recoilKick=Math.max(0,recoilKick-dt*32);
 upperSprite.y=recoilKick;
 mech.position.set(player.x,player.y);hitFlash=Math.max(0,hitFlash-dt);upperSprite.tint=hitFlash>0?0xff7777:0xffffff;
 spawnClock-=dt;const maxEnemies=Math.min(320,55+Math.floor(elapsed*1.7));const spawnEvery=Math.max(.10,.72-elapsed*.0035);if(spawnClock<=0&&enemies.length<maxEnemies){spawnClock+=spawnEvery;for(let i=0;i<Math.min(4,1+Math.floor(elapsed/42));i++)spawnEnemy()}
 fireClock-=dt;let volleys=0;while(fireClock<=0&&volleys<6){fireClock+=player.fireRate;fire();volleys++}if(volleys===6)fireClock=Math.max(0,fireClock);
 for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];const x=player.x-e.x,y=player.y-e.y,d=Math.max(.001,dist(x,y));e.x+=(x/d)*e.speed*dt;e.y+=(y/d)*e.speed*dt;e.view.position.set(e.x,e.y);e.view.rotation=Math.atan2(y,x)+Math.PI/2;e.attack-=dt;if(d<e.radius+12&&e.attack<=0){e.attack=.8;damagePlayer(e.kind==='brute'?22:e.kind==='raider'?12:7)}}
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.view.position.set(b.x,b.y);let destroyed=false;
 for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(b.hits.has(e))continue;if(sq(e.x-b.x)+sq(e.y-b.y)<sq(e.radius+4)){
  b.hits.add(e);e.hp-=b.damage;particle(b.x,b.y,'#ffa66b');if(e.hp<=0)enemyDeath(e);
  b.remaining--;if(b.remaining<=0){destroyed=true;break}
 }}
 if(destroyed||b.life<=0){b.view.destroy();bullets.splice(i,1)}}
 for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.life+=dt;const dd=dist(player.x-d.x,player.y-d.y);if(dd<player.magnet){d.x+=(player.x-d.x)*Math.min(1,dt*7);d.y+=(player.y-d.y)*Math.min(1,dt*7);d.view.position.set(d.x,d.y)}if(dd<13){if(d.kind==='xp'){xp+=d.value;if(xp>=xpNeeded&&!leveling)levelUp()}else{salvageRun+=d.value;playSound(420,.06,'sine',.03)}d.view.destroy();drops.splice(i,1)}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.view.position.set(p.x,p.y);p.view.alpha=clamp(p.life/p.max,0,1);if(p.life<=0){p.view.destroy();particles.splice(i,1)}}
 for(let i=wrecks.length-1;i>=0;i--){const w=wrecks[i];w.life-=dt;w.view.alpha=Math.min(1,w.life/4);if(w.life<=0){w.view.destroy();wrecks.splice(i,1)}}
 if(noticeUntil<elapsed)$('notice').textContent='';updateHUD();camera();}
function camera(){const sx=rand(-screenShake,screenShake),sy=rand(-screenShake,screenShake);screenShake*=.83;world.position.set(W/2-player.x+sx,H/2-player.y+sy);const cx=Math.floor(player.x/128),cy=Math.floor(player.y/128);let i=0;for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){const t=ground.children[i++];t.position.set((cx+x)*128,(cy+y)*128)}}
async function init(){W=Math.round(window.innerWidth/3);H=Math.round(window.innerHeight/3);app=new PIXI.Application();await app.init({width:W,height:H,background:'#202b2d',antialias:false,resolution:1,autoDensity:false,preference:'webgl'});app.canvas.style.width='100%';app.canvas.style.height='100%';app.canvas.style.imageRendering='pixelated';$('game').appendChild(app.canvas);
 makeTextures();await buildBastionAtlas();world=new PIXI.Container();app.stage.addChild(world);createTileScene();makeMech();mech.position.set(0,0);camera();renderPreview();app.ticker.add((ticker:any)=>tick(ticker.deltaMS/1000));window.addEventListener('resize',()=>{W=Math.round(window.innerWidth/3);H=Math.round(window.innerHeight/3);app.renderer.resize(W,H);camera()});
 $('start').onclick=startRun;$('retry').onclick=startRun;$('hangar-open').onclick=()=>openHangar(false);$('end-hangar').onclick=()=>openHangar(false);$('hangar-close').onclick=()=>{$('hangar').classList.add('hidden');if(armorOwned)armorOverlay.visible=true;if(dead){$('end').classList.remove('hidden')}else if(!playing){$('menu').classList.remove('hidden')}else{paused=false}};$('buy-armor').onclick=()=>{if(!armorOwned&&permanentSalvage>=30){armorOwned=true;permanentSalvage-=30;save();armorOverlay.visible=true;openHangar(hangarFromGame);$('hangar-message').textContent='REINFORCED ARMOR INSTALLED // VISIBLE IN COMBAT. +35 MAX ARMOR.';playSound(310,.2,'triangle',.12)}};
 window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='p'&&playing){paused=!paused;notice(paused?'PAUSED':'RESUMED')}if(k==='h'&&playing&&!leveling){if($('hangar').classList.contains('hidden')){paused=true;openHangar(true)}else{($('hangar-close') as HTMLButtonElement).click()}}if(k==='m')muted=!muted});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
 const ring=$('touch').querySelector('.touch-ring') as HTMLElement,stick=$('touch-stick');function moveTouch(e:PointerEvent){const r=ring.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.max(1,dist(x,y)),s=Math.min(1,d/43);touchMove={x:x/d*s,y:y/d*s};stick.style.transform=`translate(${touchMove.x*33}px,${touchMove.y*33}px)`}ring.addEventListener('pointerdown',e=>{ring.setPointerCapture(e.pointerId);moveTouch(e)});ring.addEventListener('pointermove',e=>{if(ring.hasPointerCapture(e.pointerId))moveTouch(e)});function stopTouch(){touchMove={x:0,y:0};stick.style.transform='none'}ring.addEventListener('pointerup',stopTouch);ring.addEventListener('pointercancel',stopTouch);
}
init().catch(e=>{console.error(e);$('menu').querySelector('p')!.textContent='Unable to initialize graphics. Check PixiJS CDN, sprite assets and WebGL availability.'});