/** IRONWAKE weapon geometry and targeting. Pure game math: no PIXI or DOM dependency. */
namespace WeaponKit {
 export type Vector={x:number,y:number};
 export type Target=Vector & {id?:number};
 export type AimMode='body-snap'|'fixed-forward'|'turret-independent';
 export type TriggerMode='on-target'|'continuous';
 export type WeaponDefinition={
  id:string;slot:string;aimMode:AimMode;arcDegrees:number;
  /** Continuous slots fire without target acquisition; useful for forward guns. */
  triggerMode?:TriggerMode;
  muzzle:readonly Vector[];ejection:readonly Vector[];
  /** Optional art-specific correction to the muzzle direction, radians clockwise in screen coordinates. */
  barrelCorrections?:readonly number[];
  recoilDistance:number;projectileTexture:string;shellTexture:string;
  /** Optional slot-specific overrides; omitted stats inherit the pilot's current upgrades. */
  statOverrides?:Partial<WeaponStats>;
  /** Multiplier of pilot fire interval: <1 faster, >1 slower. */
  fireIntervalMultiplier?:number;
  soundHz:number;
 };
 export type WeaponStats={range:number;multishot:number;spreadAngle:number;damage:number;speed:number;penetration:number};
 export type Solution={target:Target;facing:number;angle:number;muzzle:Vector;ejection:Vector;shotAngles:number[]};
 export const TAU=Math.PI*2;
 export function direction(dx:number,dy:number):number{return ((Math.round(Math.atan2(dx,dy)/(Math.PI/4))+8)%8);}
 export function bearing(dir:number):number{return Math.PI/2-(dir%8)*Math.PI/4;}
 export function diff(a:number,b:number):number{return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
 export function polarAngle(from:Vector,to:Vector):number{return Math.atan2(to.y-from.y,to.x-from.x);}
 export function rotateLocal(local:Vector,dir:number):Vector{
  // Local coordinates are authored in south-facing source art: x points screen-right, y screen-down.
  const r=-dir*Math.PI/4,c=Math.cos(r),s=Math.sin(r);
  return {x:local.x*c-local.y*s,y:local.x*s+local.y*c};
 }
 export function inArc(origin:Vector,target:Vector,dir:number,arcDeg:number):boolean{
  const half=Math.min(360,Math.max(0,arcDeg))/2*Math.PI/180;
  return Math.abs(diff(polarAngle(origin,target),bearing(dir)))<=half+1e-9;
 }
 export function pickTarget(origin:Vector,targets:readonly Target[],chassisDir:number,def:WeaponDefinition,range:number):Target|undefined{
  let chosen:Target|undefined,closest=range*range;
  for(const target of targets){const dx=target.x-origin.x,dy=target.y-origin.y,r2=dx*dx+dy*dy;
   if(r2<=closest&&inArc(origin,target,chassisDir,def.arcDegrees)){chosen=target;closest=r2;}
  }return chosen;
 }
 export function solve(origin:Vector,target:Target,chassisDir:number,def:WeaponDefinition,stats:WeaponStats):Solution|null{
  if(!inArc(origin,target,chassisDir,def.arcDegrees))return null;
  const targetAngle=polarAngle(origin,target),dir=direction(target.x-origin.x,target.y-origin.y);
  let facing=def.aimMode==='fixed-forward'?chassisDir:dir;
  // A fixed full-body sprite can only fire along its drawn orientation. Turrets may aim freely.
  const correction=def.barrelCorrections?.[facing]??0;
  const angle=def.aimMode==='turret-independent'?targetAngle:bearing(facing)+correction;
  // If a target is between sprite headings, accept only the nearest discrete heading.
  if(def.aimMode==='body-snap'&&Math.abs(diff(targetAngle,angle))>Math.PI/8+0.001)return null;
  // For fixed weapon slots, firing direction must still obey the configured forward arc.
  if(Math.abs(diff(angle,bearing(chassisDir)))>def.arcDegrees*Math.PI/360+0.001)return null;
  const muzzleLocal=def.muzzle[facing],ejectionLocal=def.ejection[facing];
  if(!muzzleLocal||!ejectionLocal)throw Error(`Weapon ${def.id} missing facing anchor ${facing}`);
  const muzzle={x:origin.x+muzzleLocal.x,y:origin.y+muzzleLocal.y};
  const ejection={x:origin.x+ejectionLocal.x,y:origin.y+ejectionLocal.y};
  const count=Math.max(1,Math.min(64,Math.floor(stats.multishot)));
  const shotAngles=Array.from({length:count},(_,i)=>angle+(i-(count-1)/2)*stats.spreadAngle);
  return {target,facing,angle,muzzle,ejection,shotAngles};
 }
 /** Generate a shot from the illustrated chassis facing, even with no target nearby. */
 export function solveForward(origin:Vector,chassisDir:number,def:WeaponDefinition,stats:WeaponStats):Solution{
  const facing=((chassisDir%8)+8)%8;
  const angle=bearing(facing)+(def.barrelCorrections?.[facing]??0);
  const muzzleLocal=def.muzzle[facing],ejectionLocal=def.ejection[facing];
  if(!muzzleLocal||!ejectionLocal)throw Error(`Weapon ${def.id} missing facing anchor ${facing}`);
  const count=Math.max(1,Math.min(64,Math.floor(stats.multishot)));
  const shotAngles=Array.from({length:count},(_,i)=>angle+(i-(count-1)/2)*stats.spreadAngle);
  // The synthetic target is a firing-direction reference, not an acquired enemy.
  return {target:{x:origin.x+Math.cos(angle)*stats.range,y:origin.y+Math.sin(angle)*stats.range},
   facing,angle,muzzle:{x:origin.x+muzzleLocal.x,y:origin.y+muzzleLocal.y},
   ejection:{x:origin.x+ejectionLocal.x,y:origin.y+ejectionLocal.y},shotAngles};
 }
 export function makeDirectionalAnchors(base:Vector):Vector[]{
  return Array.from({length:8},(_,i)=>rotateLocal(base,i));
 }
 // Offsets are calibrated against the *complete* 64x96 illustrated Bastion atlas.
 // All values are relative to sprite pivot (32,48), scaled to world coordinates (1.08).
 // Gameplay-friendly aiming: projectiles originate on the chassis centerline,
 // slightly ahead of the torso, instead of offset sideways by the illustrated grip.
 // Prevents forward-only rounds missing an entire parallel lane next to the target.
 const bastionMuzzle:Vector[]=Array.from({length:8},(_,i)=>{
  const a=bearing(i);return {x:Math.cos(a)*32,y:Math.sin(a)*32};
 });
 const bastionEjection:Vector[]=Array.from({length:8},(_,i)=>{
  const a=bearing(i);return {x:Math.cos(a)*10-Math.sin(a)*12,y:Math.sin(a)*10+Math.cos(a)*12};
 });
 export const bastionAutocannon:WeaponDefinition={
  id:'m14-autocannon',slot:'right-hand',aimMode:'fixed-forward',arcDegrees:360,triggerMode:'continuous',
  muzzle:bastionMuzzle,ejection:bastionEjection,
  recoilDistance:4,projectileTexture:'bullet',shellTexture:'shell',soundHz:70
 };
 export function validateDefinition(w:WeaponDefinition):void{
  if(w.muzzle.length!==8||w.ejection.length!==8)throw Error(`${w.id}: expected eight per-direction anchors`);
  if(w.triggerMode==='continuous'&&w.aimMode!=='fixed-forward')throw Error(`${w.id}: continuous fire requires fixed-forward aim`);
  if(w.arcDegrees<=0||w.arcDegrees>360||w.recoilDistance<0||(w.fireIntervalMultiplier!==undefined&&w.fireIntervalMultiplier<=0))throw Error(`${w.id}: invalid weapon configuration`);
  for(const p of [...w.muzzle,...w.ejection])if(!Number.isFinite(p.x)||!Number.isFinite(p.y))throw Error(`${w.id}: invalid anchor`);
 }
}