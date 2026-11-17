import {GOAPPlanner,WorldState} from "@alife-sdk/core/ai";
import {validateNpcBehavior,type NpcBehavior,type NpcEvent,type NpcAction} from "@/lib/npc-behavior";
export type NpcEntity={id:string;behavior:NpcBehavior;state:string;x:number;z:number;health:number;cooldown:number;patrolDirection:number;};
export function createNpcEntity(id:string,behavior:NpcBehavior,index:number):NpcEntity{
 if(!validateNpcBehavior(behavior))throw new TypeError("Invalid NPC graph");
 return {id,behavior,state:behavior.initialState,x:(index%5)*3-6,z:Math.floor(index/5)*3-3,health:100,cooldown:0,patrolDirection:1};
}
export function transitionNpc(npc:NpcEntity,event:NpcEvent):NpcEntity{
 const rule=npc.behavior.transitions.find(t=>t.from===npc.state&&t.event===event);
 return rule?{...npc,state:rule.to}:npc;
}
export function npcAction(npc:NpcEntity):NpcAction{
 return npc.behavior.states.find(s=>s.id===npc.state)?.action??"idle";
}
const planner=new GOAPPlanner();
planner.registerAction({id:"approach",cost:1,preconditions:{visible:true,near:false},effects:{near:true}});
export function advanceNpc(npc:NpcEntity,player:{x:number;z:number},dt:number):{npc:NpcEntity;hit:boolean}{
 if(npc.health<=0)return {npc:{...npc,cooldown:0},hit:false};
 const elapsed=Math.min(0.08,Math.max(0,dt));
 let next={...npc,cooldown:Math.max(0,npc.cooldown-elapsed)};
 const dx=player.x-npc.x,dz=player.z-npc.z,dist=Math.max(0.001,Math.hypot(dx,dz));
 if(next.health<25)next=transitionNpc(next,"low_health");
 else if(dist<6)next=transitionNpc(next,"enemy_seen");
 else if(dist>8)next=transitionNpc(next,"enemy_lost");
 const action=npcAction(next);
 if(action==="patrol"){
  const direction=next.patrolDirection;
  next.x+=direction*elapsed*1.25;
  if(Math.abs(next.x)>10){next.patrolDirection=-direction;next=transitionNpc(next,"patrol_done");}
 }else if(action==="attack"){
  const plan=planner.plan(WorldState.from({visible:true,near:dist<1.7}),WorldState.from({near:true}));
  if(dist>=1.7&&plan.includes("approach")){
    next.x+=(dx/dist)*elapsed*2.0;next.z+=(dz/dist)*elapsed*2.0;
  }
  if(dist<1.7&&next.cooldown===0){next.cooldown=1.1;return {npc:next,hit:true};}
 }else if(action==="retreat"){
  next.x-=(dx/dist)*elapsed*2.3;next.z-=(dz/dist)*elapsed*2.3;
  if(dist>8)next=transitionNpc(next,"recover");
 }
 next.x=Math.max(-15,Math.min(15,next.x));
 next.z=Math.max(-15,Math.min(15,next.z));
 return {npc:next,hit:false};
}
