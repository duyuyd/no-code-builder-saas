"use client";
import {useEffect,useRef,useState} from "react";
import {Canvas,useFrame} from "@react-three/fiber";
import {Grid,OrbitControls} from "@react-three/drei";
import {advanceNpc,createNpcEntity,npcAction,type NpcEntity} from "@/lib/game-runtime-npc";
import type {NpcBehavior} from "@/lib/npc-behavior";
import type {StudioScene} from "@/packages/engine-3d/src";
type SavedNPC={id:string;behavior:NpcBehavior};
type Player={x:number;z:number;hp:number};
function World({behaviors,scene,onUpdate}:{behaviors:SavedNPC[];scene:StudioScene|null;onUpdate:(info:{hp:number;alive:number;actions:string[]})=>void}){
 const player=useRef<Player>({x:0,z:0,hp:100});
 const npcs=useRef(behaviors.map((entry,i)=>createNpcEntity(entry.id,entry.behavior,i)));
 const keys=useRef<Set<string>>(new Set());
 const attack=useRef(false);
 const lastHud=useRef(0);
 const playerMesh=useRef<import("three").Mesh>(null);
 const npcMeshes=useRef<Record<string,import("three").Mesh|null>>({});
 useEffect(()=>{
  const down=(event:KeyboardEvent)=>{if(["KeyW","KeyA","KeyS","KeyD","Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)){event.preventDefault();keys.current.add(event.code);if(event.code==="Space")attack.current=true;}};
  const up=(event:KeyboardEvent)=>keys.current.delete(event.code);
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);
  return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
 },[]);
 useEffect(()=>{
  const touch=(event:Event)=>{
   const cmd=(event as CustomEvent<{code:string}>).detail?.code;
   if(cmd==="attack")attack.current=true;
   else if(cmd)keys.current.add(cmd);
  };
  const release=()=>keys.current.clear();
  window.addEventListener("studio-game-control",touch);
  window.addEventListener("studio-game-release",release);
  return()=>{window.removeEventListener("studio-game-control",touch);window.removeEventListener("studio-game-release",release);};
 },[]);
 useFrame(({clock},delta)=>{
  const dt=Math.min(0.08,delta),p=player.current;
  if(p.hp>0){
   const dx=Number(keys.current.has("KeyD")||keys.current.has("ArrowRight"))-Number(keys.current.has("KeyA")||keys.current.has("ArrowLeft"));
   const dz=Number(keys.current.has("KeyS")||keys.current.has("ArrowDown"))-Number(keys.current.has("KeyW")||keys.current.has("ArrowUp"));
   const n=Math.max(1,Math.hypot(dx,dz));p.x=Math.max(-15,Math.min(15,p.x+dx/n*dt*4));p.z=Math.max(-15,Math.min(15,p.z+dz/n*dt*4));
   if(attack.current){let nearest:NpcEntity|null=null;let best=2.3;for(const npc of npcs.current){const d=Math.hypot(npc.x-p.x,npc.z-p.z);if(d<best&&npc.health>0){best=d;nearest=npc;}}if(nearest)nearest.health=Math.max(0,nearest.health-30);}
   for(let i=0;i<npcs.current.length;i++){
    const step=advanceNpc(npcs.current[i],p,dt);npcs.current[i]=step.npc;if(step.hit)p.hp=Math.max(0,p.hp-8);
   }
  }
  attack.current=false;
  if(playerMesh.current){playerMesh.current.position.set(p.x,0.65,p.z);}
  for(const n of npcs.current){const m=npcMeshes.current[n.id];if(m){m.position.set(n.x,0.65,n.z);m.scale.y=n.health>0?1:0.15;}}
  if(clock.elapsedTime-lastHud.current>0.2){
   lastHud.current=clock.elapsedTime;onUpdate({hp:p.hp,alive:npcs.current.filter(n=>n.health>0).length,actions:npcs.current.filter(n=>n.health>0).map(n=>npcAction(n))});
  }
 });
 return <>
  <ambientLight intensity={0.75}/><directionalLight position={[7,12,4]} intensity={2.5}/>
  <Grid infiniteGrid sectionColor="#475569" cellColor="#334155" position={[0,-0.01,0]}/>
  <mesh ref={playerMesh} position={[0,0.65,0]}><capsuleGeometry args={[0.4,0.5,6,12]}/><meshStandardMaterial color="#22d3ee"/></mesh>
  {npcs.current.map(n=><mesh key={n.id} ref={m=>{npcMeshes.current[n.id]=m;}} position={[n.x,0.65,n.z]}>
    <boxGeometry args={[0.8,1.3,0.8]}/><meshStandardMaterial color={n.behavior.initialState==="combat"?"#e11d48":"#f97316"}/>
   </mesh>)}
  {scene?.objects.slice(0,80).map(o=><mesh key={o.id} position={[...o.position]} rotation={[...o.rotation]} scale={[...o.scale]}>
   {o.primitive==="sphere"?<sphereGeometry args={[0.5,18,12]}/>:o.primitive==="plane"?<planeGeometry args={[1,1]}/>:<boxGeometry args={[1,1,1]}/>}
   <meshStandardMaterial color={o.material.color} roughness={o.material.roughness} metalness={o.material.metalness}/>
  </mesh>)}
  <OrbitControls makeDefault maxDistance={45} minDistance={5}/>
 </>;
}
export default function NpcRuntime({behaviors,scene}:{behaviors:SavedNPC[];scene:StudioScene|null}){
 const [hud,setHud]=useState({hp:100,alive:behaviors.length,actions:[] as string[]});
 const emit=(code:string)=>window.dispatchEvent(new CustomEvent("studio-game-control",{detail:{code}}));
 const stop=()=>window.dispatchEvent(new Event("studio-game-release"));
 return <section className="relative min-h-[530px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white">
  <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap justify-between gap-2 rounded-xl bg-slate-900/90 p-3 text-xs">
   <strong>HP {hud.hp}/100 · NPC còn lại {hud.alive}/{behaviors.length}</strong>
   <span className="text-orange-300">Logic: {hud.actions.slice(0,6).join(", ")||"Không có NPC đang hoạt động"}</span>
  </div>
  <div className="h-[530px]"><Canvas camera={{position:[11,12,13],fov:52}} dpr={[1,1.5]}><World behaviors={behaviors} scene={scene} onUpdate={setHud}/></Canvas></div>
  <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between">
   <div className="grid grid-cols-3 gap-1">{[["","KeyW","↑"],["KeyA","KeyS","←"],["KeyD","","→"]].map((group,i)=><div key={i} className="contents">{group.map((key,j)=>key?<button key={j} onPointerDown={()=>emit(key)} onPointerUp={stop} onPointerLeave={stop} className="rounded-lg bg-slate-800/90 px-4 py-3 text-lg">{group[j]==="KeyW"?"↑":group[j]==="KeyS"?"↓":group[j]==="KeyA"?"←":"→"}</button>:<span key={j}/>)}</div>)}</div>
   <button onClick={()=>emit("attack")} className="rounded-full bg-rose-600 px-5 py-5 text-sm font-bold">Tấn công</button>
  </div>
  <p className="sr-only">WASD hoặc phím mũi tên để di chuyển, Space để tấn công. Chỉ tải state machine NPC đã phê duyệt.</p>
 </section>;
}
