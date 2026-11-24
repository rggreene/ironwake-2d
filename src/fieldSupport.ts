/** Field support is run-only; it never touches saved salvage or purchased ranks. */
namespace FieldSupport {
 export const firstCallAt=180;
 export const cooldown=240;
 export const repairCost=2;
 export const exchangeCost=4;
 export const refitCost=3;
 export const startingCredits=3;
 export const killsPerCredit=12;
 export type Choice='repair'|'exchange'|'refit';
 export type State={credits:number;nextCallAt:number;exchangesLeft:number;refitsLeft:number;used:boolean};
 export function fresh():State{return {credits:startingCredits,nextCallAt:firstCallAt,exchangesLeft:1,refitsLeft:1,used:false}}
 export function ready(time:number,state:State){return time>=state.nextCallAt}
 export function price(choice:Choice){return choice==='repair'?repairCost:choice==='exchange'?exchangeCost:refitCost}
 export function allowed(choice:Choice,state:State,health:number,maxHealth:number){
  if(state.credits<price(choice))return false;
  if(choice==='repair')return health<maxHealth;
  if(choice==='exchange')return state.exchangesLeft>0&&health<maxHealth;
  return state.refitsLeft>0;
 }
 export function awardKill(kills:number,state:State){if(kills>0&&kills%killsPerCredit===0)state.credits++}
 export function purchase(choice:Choice,state:State,health:number,maxHealth:number){
  if(!allowed(choice,state,health,maxHealth))return null;
  state.credits-=price(choice);
  if(choice==='exchange')state.exchangesLeft--;
  if(choice==='refit')state.refitsLeft--;
  return choice==='repair'?Math.min(maxHealth,health+Math.ceil(maxHealth*.4)):choice==='exchange'?maxHealth:health;
 }
 export function request(time:number,state:State){if(!ready(time,state))return false;state.nextCallAt=time+cooldown;state.used=true;return true}
}
