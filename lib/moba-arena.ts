export type Team="blue"|"red";
export type Point={x:number;y:number};
export type Lane={id:"top"|"mid"|"bottom";points:Point[]};
export type ArenaMap={
 biome:"forest"|"ember";
 palette:{ground:string;lane:string;laneEdge:string;river:string;bush:string;blue:string;red:string;stone:string};
 lanes:Lane[];river:Point[];bushes:Point[];camps:Point[];
};
export type Hero={id:number;team:Team;name:string;lane:number;x:number;y:number;hp:number;maxHp:number;progress:number;attackAt:number;respawnAt:number;kills:number;ai:boolean};
export type Minion={id:number;team:Team;lane:number;progress:number;x:number;y:number;hp:number;attackAt:number};
export type Tower={id:number;team:Team;lane:number;progress:number;x:number;y:number;hp:number;attackAt:number};
export type Effect={x:number;y:number;color:string;radius:number;expires:number};
export type ArenaState={time:number;heroes:Hero[];minions:Minion[];towers:Tower[];cores:{blue:number;red:number};effects:Effect[];waveAt:number;nextId:number;winner:Team|null;playerTarget:Point|null;cooldowns:{attack:number;spin:number;dash:number;heal:number};playerKills:number;playerDeaths:number;lastFps:number};
const hex=(v:unknown)=>typeof v==="string"&&/^#[\da-f]{6}$/i.test(v);
const point=(v:unknown):v is Point=>!!v&&typeof v==="object"&&Number.isFinite((v as Point).x)&&Number.isFinite((v as Point).y)&&(v as Point).x>=0&&(v as Point).x<=100&&(v as Point).y>=0&&(v as Point).y<=100;
export function validateArenaMap(v:unknown):v is ArenaMap{
 if(!v||typeof v!=="object"||Array.isArray(v))return false;
 const a=v as Record<string,unknown>,p=a.palette as Record<string,unknown>|undefined;
 if(a.biome!=="forest"&&a.biome!=="ember")return false;
 if(!p||!["ground","lane","laneEdge","river","bush","blue","red","stone"].every(k=>hex(p[k])))return false;
 if(!Array.isArray(a.lanes)||a.lanes.length!==3||a.lanes.some((l:Lane)=>!["top","mid","bottom"].includes(l?.id)||!Array.isArray(l.points)||l.points.length<3||l.points.length>10||!l.points.every(point)))return false;
 if(new Set((a.lanes as Lane[]).map(l=>l.id)).size!==3)return false;
 if(!Array.isArray(a.river)||a.river.length<2||a.river.length>12||!a.river.every(point))return false;
 for(const key of ["bushes","camps"]){
  const value=a[key];
  if(!Array.isArray(value)||value.length>35||!value.every(point))return false;
 }
 return JSON.stringify(v).length<22000;
}
export const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function pathPoint(lane:Lane,progress:number):Point{
 const lengths=lane.points.slice(1).map((p,i)=>distance(p,lane.points[i])),total=lengths.reduce((n,v)=>n+v,0);
 if(total<=0)return lane.points[0];
 let left=clamp(progress,0,1)*total;
 for(let i=0;i<lengths.length;i++){
  if(left<=lengths[i]||i===lengths.length-1){
   const t=lengths[i]?left/lengths[i]:0;
   return {x:lane.points[i].x+(lane.points[i+1].x-lane.points[i].x)*t,y:lane.points[i].y+(lane.points[i+1].y-lane.points[i].y)*t};
  }
  left-=lengths[i];
 }
 return lane.points[lane.points.length-1];
}
export function basePoint(m:ArenaMap,team:Team):Point{
 const mid=m.lanes.find(l=>l.id==="mid")??m.lanes[1];
 return team==="blue"?mid.points[0]:mid.points[mid.points.length-1];
}
export function initArena(m:ArenaMap):ArenaState{
 const heroes:Hero[]=[];
 for(let teamIndex=0;teamIndex<2;teamIndex++){
  const team:Team=teamIndex===0?"blue":"red";
  for(let i=0;i<5;i++){
   const lane=i===0?1:i<3?0:2;
   const prog=team==="blue"?.035:.965;
   const p=pathPoint(m.lanes[lane],prog);
   heroes.push({id:teamIndex*5+i,team,name:team==="blue"?(i===0?"Bạn":"Đồng minh "+i):"Đối thủ "+(i+1),
    lane,x:p.x+(i%2)*1.1,y:p.y+(i%2)*1.1,hp:130,maxHp:130,progress:prog,attackAt:0,respawnAt:0,kills:0,ai:team==="red"||i!==0});
  }
 }
 const towers:Tower[]=[];let id=0;
 for(let lane=0;lane<3;lane++){
  for(const team of ["blue","red"] as Team[]){
   for(const t of team==="blue"?[.23,.43]:[.57,.77]){
    const p=pathPoint(m.lanes[lane],t);
    towers.push({id:id++,team,lane,progress:t,x:p.x,y:p.y,hp:220,attackAt:0});
   }
  }
 }
 return {time:0,heroes,minions:[],towers,cores:{blue:750,red:750},effects:[],waveAt:0,nextId:100,winner:null,playerTarget:null,cooldowns:{attack:0,spin:0,dash:0,heal:0},playerKills:0,playerDeaths:0,lastFps:30};
}
function approach(p:Point,target:Point,amount:number):Point{
 const d=distance(p,target);if(d<.0001||amount>=d)return {...target};
 return {x:p.x+(target.x-p.x)*amount/d,y:p.y+(target.y-p.y)*amount/d};
}
function damageHero(s:ArenaState,h:Hero,amount:number,sourceTeam:Team){
 if(h.hp<=0)return;
 h.hp=Math.max(0,h.hp-amount);
 s.effects.push({x:h.x,y:h.y,color:sourceTeam==="blue"?"#38bdf8":"#fb7185",radius:3,expires:s.time+.28});
 if(h.hp===0){h.respawnAt=s.time+9;if(h.id===0)s.playerDeaths++;
   if(sourceTeam==="blue"&&h.team==="red")s.playerKills+=0; }
}
function hitClosest(s:ArenaState,team:Team,origin:Point,radius:number,damage:number,excludeTower=false):boolean{
 let target:{kind:"hero"|"minion"|"tower"|"core";idx:number;dist:number}|null=null;
 const choose=(kind:"hero"|"minion"|"tower"|"core",idx:number,d:number)=>{
  if(d>radius||target&&d>=target.dist)return;
  target={kind,idx,dist:d};
 };
 s.minions.forEach((v,i)=>{if(v.team!==team&&v.hp>0)choose("minion",i,distance(origin,v));});
 s.heroes.forEach((v,i)=>{if(v.team!==team&&v.hp>0)choose("hero",i,distance(origin,v));});
 if(!excludeTower)s.towers.forEach((v,i)=>{if(v.team!==team&&v.hp>0)choose("tower",i,distance(origin,v));});
 if(!target)return false;
 const t=target as {kind:"hero"|"minion"|"tower"|"core";idx:number;dist:number};
 if(t.kind==="hero")damageHero(s,s.heroes[t.idx],damage,team);
 if(t.kind==="minion")s.minions[t.idx].hp=Math.max(0,s.minions[t.idx].hp-damage);
 if(t.kind==="tower")s.towers[t.idx].hp=Math.max(0,s.towers[t.idx].hp-damage);
 s.effects.push({x:origin.x,y:origin.y,color:team==="blue"?"#facc15":"#fda4af",radius:radius*.8,expires:s.time+.22});
 return true;
}
export function playerAction(s:ArenaState,m:ArenaMap,action:"attack"|"spin"|"dash"|"heal",direction:Point={x:0,y:0}){
 if(s.winner)return false;
 const p=s.heroes[0];if(p.hp<=0||s.cooldowns[action]>s.time)return false;
 if(action==="attack"){
  const hit=hitClosest(s,"blue",p,11,32);
  if(!hit)return false;
  s.cooldowns.attack=s.time+.55;
 }else if(action==="spin"){
  let hits=0;
  for(const h of s.heroes)if(h.team==="red"&&h.hp>0&&distance(h,p)<14){damageHero(s,h,58,"blue");hits++;}
  for(const u of s.minions)if(u.team==="red"&&u.hp>0&&distance(u,p)<14){u.hp=Math.max(0,u.hp-55);hits++;}
  for(const t of s.towers)if(t.team==="red"&&t.hp>0&&distance(t,p)<14){t.hp=Math.max(0,t.hp-24);hits++;}
  s.effects.push({x:p.x,y:p.y,color:"#fbbf24",radius:14,expires:s.time+.45});
  s.cooldowns.spin=s.time+6;
  if(!hits)return true;
 }else if(action==="dash"){
  const len=Math.hypot(direction.x,direction.y)||1;
  const target=s.playerTarget??{x:p.x+direction.x/len*13,y:p.y+direction.y/len*13};
  const point=approach(p,target,13);
  p.x=clamp(point.x,2,98);p.y=clamp(point.y,2,98);
  s.effects.push({x:p.x,y:p.y,color:"#67e8f9",radius:8,expires:s.time+.4});
  s.cooldowns.dash=s.time+5;
 }else{
  p.hp=Math.min(p.maxHp,p.hp+48);
  s.effects.push({x:p.x,y:p.y,color:"#86efac",radius:11,expires:s.time+.6});
  s.cooldowns.heal=s.time+12;
 }
 return true;
}
function spawnWave(s:ArenaState,m:ArenaMap){
 for(let lane=0;lane<3;lane++){
  for(const team of ["blue","red"] as Team[]){
   for(let i=0;i<3;i++){
    const progress=team==="blue"?.015+i*.008:.985-i*.008;
    const point=pathPoint(m.lanes[lane],progress);
    s.minions.push({id:s.nextId++,team,lane,progress,...point,hp:54,attackAt:0});
   }
  }
 }
 s.waveAt=s.time+12;
}
export function tickArena(s:ArenaState,m:ArenaMap,dt:number,move:Point){
 if(s.winner)return;
 dt=clamp(dt,0,.055);s.time+=dt;
 const p=s.heroes[0];
 if(p.hp<=0&&s.time>=p.respawnAt){const origin=basePoint(m,"blue");p.x=origin.x;p.y=origin.y;p.hp=p.maxHp;}
 if(p.hp>0){
  const strength=Math.hypot(move.x,move.y);
  if(strength>.1){p.x=clamp(p.x+move.x/strength*20*dt,1,99);p.y=clamp(p.y+move.y/strength*20*dt,1,99);s.playerTarget=null;}
  else if(s.playerTarget){const n=approach(p,s.playerTarget,20*dt);p.x=n.x;p.y=n.y;if(distance(p,s.playerTarget)<.5)s.playerTarget=null;}
 }
 if(s.time>=s.waveAt)spawnWave(s,m);
 for(const h of s.heroes){
  if(!h.ai)continue;
  if(h.hp<=0){if(s.time>=h.respawnAt){const spawn=basePoint(m,h.team);h.x=spawn.x;h.y=spawn.y;h.hp=h.maxHp;h.progress=h.team==="blue"?.01:.99;}continue;}
  const foes=s.heroes.filter(x=>x.team!==h.team&&x.hp>0&&distance(x,h)<14);
  const minions=s.minions.filter(x=>x.team!==h.team&&x.hp>0&&distance(x,h)<13);
  const towers=s.towers.filter(x=>x.team!==h.team&&x.hp>0&&distance(x,h)<15);
  const potential:Point[]=[...minions,...foes,...towers];
  const target=potential.sort((a,b)=>distance(a,h)-distance(b,h))[0];
  if(target&&distance(h,target)<9){
   if(s.time>=h.attackAt){hitClosest(s,h.team,h,10,15);h.attackAt=s.time+.85;}
  }else if(target){
   const next=approach(h,target,12*dt);h.x=next.x;h.y=next.y;
  }else{
   const nextProgress=clamp(h.progress+(h.team==="blue"?1:-1)*.007*dt,0,1);
   const next=pathPoint(m.lanes[h.lane],nextProgress);
   h.x=next.x;h.y=next.y;h.progress=nextProgress;
  }
 }
 for(const u of s.minions){
  if(u.hp<=0)continue;
  const foes=s.heroes.filter(h=>h.team!==u.team&&h.hp>0&&distance(h,u)<8);
  const enemyMinions=s.minions.filter(v=>v.team!==u.team&&v.hp>0&&distance(v,u)<8);
  const enemyTowers=s.towers.filter(t=>t.team!==u.team&&t.hp>0&&distance(t,u)<8);
  if(foes.length||enemyMinions.length||enemyTowers.length){
   if(s.time>=u.attackAt){hitClosest(s,u.team,u,8,10);u.attackAt=s.time+1.1;}
  }else{
   u.progress=clamp(u.progress+(u.team==="blue"?1:-1)*.010*dt,0,1);
   const next=pathPoint(m.lanes[u.lane],u.progress);u.x=next.x;u.y=next.y;
   if((u.team==="blue"&&u.progress>.975)||(u.team==="red"&&u.progress<.025)){
    const enemy=u.team==="blue"?"red":"blue";
    const aliveTowers=s.towers.some(t=>t.team===enemy&&t.hp>0);
    if(!aliveTowers){s.cores[enemy]=Math.max(0,s.cores[enemy]-18*dt);}
   }
  }
 }
 for(const tower of s.towers){
  if(tower.hp<=0||s.time<tower.attackAt)continue;
  if(hitClosest(s,tower.team,tower,12,21,true))tower.attackAt=s.time+1.3;
 }
 for(const hero of s.heroes){
  if(hero.hp<=0)continue;
  const enemy=hero.team==="blue"?"red":"blue";
  const core=basePoint(m,enemy);
  if(distance(hero,core)<8&&!s.towers.some(t=>t.team===enemy&&t.hp>0)){
   s.cores[enemy]=Math.max(0,s.cores[enemy]-24*dt);
   s.effects.push({x:core.x,y:core.y,color:"#facc15",radius:8,expires:s.time+.25});
  }
 }
 if(s.cores.red<=0)s.winner="blue";
 if(s.cores.blue<=0)s.winner="red";
 s.effects=s.effects.filter(effect=>effect.expires>s.time).slice(-55);
 s.minions=s.minions.filter(u=>u.hp>0&&u.progress>0&&u.progress<1).slice(-120);
}
