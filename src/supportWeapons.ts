/** Grounded IRONWAKE auxiliary weapon specifications, targeting and turn-rate mathematics. */
namespace SupportWeapons {
 export type Kind='pd'|'grenade'|'missile';
 export type Target={x:number;y:number;hp:number;max:number;kind:string};
 export type Spec={label:string;short:string;range:number;cooldown:number;damage:number;speed:number;radius:number;life:number;texture:string};
 export const definitions:Record<Kind,Spec>={
  pd:{label:'12.7 MM DEFENSE GUN',short:'PD',range:155,cooldown:.52,damage:10,speed:450,radius:0,life:.5,texture:'pdRound'},
  grenade:{label:'40 MM GRENADE LAUNCHER',short:'HE',range:230,cooldown:3.0,damage:43,speed:220,radius:49,life:1.4,texture:'grenadeRound'},
  missile:{label:'GUIDED ANTI-ARMOR',short:'ATGM',range:340,cooldown:4.5,damage:88,speed:155,radius:38,life:3,texture:'missileRound'}
 };
 export const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 export function stats(k:Kind,level:number):Spec{const s=definitions[k],up=Math.max(0,level-1);
  return {...s,damage:s.damage*(1+up*(k==='missile'?.32:k==='grenade'?.25:.22)),
   cooldown:Math.max(k==='pd'?.16:.8,s.cooldown*Math.pow(k==='pd'?.86:.90,up)),
   radius:s.radius*(1+(k==='grenade'?.15:k==='missile'?.07:0)*up)};
 }
 export function targetScore(k:Kind,target:Target,origin:{x:number;y:number}):number{
  const dist=Math.hypot(target.x-origin.x,target.y-origin.y);
  if(k==='missile'){const bonus=target.kind==='boss'?1200:target.kind==='prototype'?450:target.kind==='heavy'?300:0;
   return bonus+(target.max/Math.max(1,target.hp))*15-dist*.20;}
  if(k==='grenade'){const bonus=target.kind==='boss'?30:target.kind==='heavy'?20:0;return bonus-dist;}
  return -dist;
 }
 export function selectTarget<T extends Target>(kind:Kind,targets:readonly T[],origin:{x:number;y:number},range:number):T|null{
  let best:T|null=null,score=-Infinity;
  for(const t of targets){if(t.hp<=0||Math.hypot(t.x-origin.x,t.y-origin.y)>range)continue;
   const s=targetScore(kind,t,origin);if(s>score){score=s;best=t;}}
  return best;
 }
 export function turnToward(from:number,to:number,maxTurn:number):number{
  const diff=Math.atan2(Math.sin(to-from),Math.cos(to-from));return from+clamp(diff,-maxTurn,maxTurn);
 }
 export function validate(s:Spec){if(s.range<=0||s.cooldown<=0||s.damage<=0||s.speed<=0||s.life<=0||s.radius<0)throw Error('Invalid support weapon '+s.label);}
}