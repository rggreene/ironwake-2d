/** IRONWAKE v1.2: deterministic, performance-bounded threat scheduling. */
namespace ThreatDirector {
 export type Kind = 'worker'|'tank'|'light'|'heavy';
 export type Preset = 'recruit'|'standard'|'veteran'|'hellfront';
 export interface Tuning { preset:Preset; intensity:number; hp:number; damage:number; speed:number; scout:number; raider:number; brute:number; assist:boolean }
 export const defaults:Tuning={preset:'standard',intensity:1,hp:1,damage:1,speed:1,scout:1,raider:1,brute:1,assist:true};
 export const profiles:Record<Preset,{density:number,hp:number,damage:number,speed:number}>={
  recruit:{density:.72,hp:.85,damage:.65,speed:.91},
  standard:{density:1,hp:1,damage:1,speed:1},
  veteran:{density:1.28,hp:1.20,damage:1.3,speed:1.07},
  hellfront:{density:1.72,hp:1.40,damage:1.6,speed:1.12}
 };
 export const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
 export function threat(elapsed:number,t:Tuning){return clamp((5.7+elapsed*.105+elapsed*elapsed*.00007)*profiles[t.preset].density*t.intensity,3.5,185)}
 export function cap(elapsed:number,t:Tuning){return Math.floor(clamp((20+elapsed*.25)*profiles[t.preset].density*t.intensity,15,230))}
 export function weights(elapsed:number,t:Tuning):Record<Kind,number>{
  const minute=elapsed/60;
  return {
   worker:Math.max(.26,.9-minute*.055)*t.scout,
   tank:(minute<1.1?0:Math.min(.32,.10+(minute-1.1)*.03))*t.scout,
   light:(minute<2.25?0:Math.min(.48,.14+(minute-2.25)*.04))*t.raider,
   heavy:(minute<3.9?0:Math.min(.26,(minute-3.9)*.046))*t.brute
  };
 }
 export function choose(elapsed:number,t:Tuning,roll:number):Kind{
  const weightsNow=weights(elapsed,t),sum=Object.values(weightsNow).reduce((a,b)=>a+b,0);
  if(sum<=0)return 'worker';let needle=clamp(roll,0,.999999)*sum;
  for(const kind of ['worker','tank','light','heavy'] as const){needle-=weightsNow[kind];if(needle<0)return kind}
  return 'worker';
 }
 export const cost:Record<Kind,number>={worker:1,tank:2.1,light:2.7,heavy:6};
 export function budgetPerSecond(elapsed:number,t:Tuning,recentDamage:number){
  const assist=t.assist&&recentDamage>0?clamp(1-recentDamage*.003,.72,1):1;
  return clamp(threat(elapsed,t)/8*.95*assist,.45,6);
 }
 export function multipliers(t:Tuning){const p=profiles[t.preset];return {hp:t.hp*p.hp,damage:t.damage*p.damage,speed:t.speed*p.speed}}
}