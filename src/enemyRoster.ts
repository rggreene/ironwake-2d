/** IRONWAKE v1.7: graduated, data-driven industrial battlefield roster. */
namespace EnemyRoster {
 export type Kind = 'worker'|'tank'|'light'|'heavy'|'prototype'|'boss';
 export type Role = 'swarm'|'ranged'|'skirmisher'|'anchor'|'elite'|'boss';
 export type Spec = {id:Kind;name:string;role:Role;hp:number;speed:number;radius:number;contact:number;interval:number;xp:number;salvage:number;cost:number;introduced:number;scale:number};
 export const definitions:Record<Kind,Spec>={
  worker:{id:'worker',name:'MW-1 MULE',role:'swarm',hp:17,speed:40,radius:8,contact:3,interval:1.1,xp:1,salvage:.08,cost:1,introduced:0,scale:.66},
  tank:{id:'tank',name:'SV-2 WARDOG',role:'ranged',hp:45,speed:24,radius:14,contact:7,interval:1.6,xp:2,salvage:.18,cost:2.1,introduced:65,scale:.92},
  light:{id:'light',name:'LS-4 NEEDLE',role:'skirmisher',hp:43,speed:54,radius:12,contact:8,interval:1.05,xp:3,salvage:.2,cost:2.7,introduced:135,scale:.8},
  heavy:{id:'heavy',name:'HS-7 BULWARK',role:'anchor',hp:120,speed:18,radius:18,contact:15,interval:1.55,xp:6,salvage:.65,cost:6,introduced:235,scale:1.0},
  prototype:{id:'prototype',name:'PX-1 VIPER',role:'elite',hp:285,speed:62,radius:18,contact:16,interval:1.35,xp:16,salvage:1,cost:0,introduced:330,scale:1.0},
  boss:{id:'boss',name:'MA-0 GOLIATH',role:'boss',hp:750,speed:13,radius:34,contact:22,interval:1.65,xp:45,salvage:1,cost:0,introduced:420,scale:1.8}
 };
 export const bossInterval=420; // once at 7:00, then 14:00; never multiple active
 export const prototypeInterval=330; // first elite at 5:30, then scarce
 export function hasBoss(elapsed:number,lastSpawn:number,active:boolean):boolean{
  return !active&&elapsed>=bossInterval&&(lastSpawn<0 || elapsed-lastSpawn>=bossInterval);
 }
 export function hasPrototype(elapsed:number,lastSpawn:number,active:boolean):boolean{
  return !active&&elapsed>=prototypeInterval&&(lastSpawn<0 || elapsed-lastSpawn>=prototypeInterval);
 }
 export function available(kind:Kind,elapsed:number):boolean{return elapsed>=definitions[kind].introduced}
 export function collisionRadius(kind:Kind){return definitions[kind].radius+5} // forgiving forward-only fire
 export function weakSpot(kind:Kind){return kind==='tank'?1.05:1}
}
