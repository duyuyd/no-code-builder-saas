"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { StudioScene, SceneObject, Vec3 } from "@/packages/engine-3d/src";
import type { Timeline } from "@/packages/engine-4d/src";
import { evaluateTimeline } from "@/packages/engine-4d/src";
import { useMemo } from "react";

type Props = { scene:StudioScene; selectedId:string|null; onSelect:(id:string|null)=>void; timeline:Timeline; timeMs:number; };
function PrimitiveMesh({item,selected,onSelect,overrides}:{item:SceneObject;selected:boolean;onSelect:()=>void;overrides:Record<string,number>}) {
 const transform=(axis:"position"|"rotation"|"scale"):Vec3 => (["x","y","z"] as const).map((key,i)=>
  overrides[item.id+":"+axis+"."+key] ?? item[axis][i]) as unknown as Vec3;
 const geometry:ThreeElements["mesh"]["children"] = item.primitive==="sphere" ? <sphereGeometry args={[0.5,32,24]}/> :
  item.primitive==="plane" ? <planeGeometry args={[1,1]}/> : <boxGeometry args={[1,1,1]}/>;
 return <mesh position={[...transform("position")]} rotation={[...transform("rotation")]} scale={[...transform("scale")]}
   onClick={event=>{event.stopPropagation();onSelect();}} castShadow receiveShadow>
   {geometry}
   <meshStandardMaterial color={item.material.color} roughness={item.material.roughness} metalness={item.material.metalness}
      emissive={selected?"#36200b":"#000000"} emissiveIntensity={selected?0.38:0} side={2}/>
 </mesh>;
}
export default function ThreeCanvas({scene,selectedId,onSelect,timeline,timeMs}:Props){
 const overrides=useMemo(()=>evaluateTimeline(timeline,timeMs),[timeline,timeMs]);
 return <div className="h-full min-h-[280px] w-full overflow-hidden rounded-xl border border-slate-700 bg-[#101827]">
  <Canvas shadows dpr={[1,1.6]} camera={{position:[7,5,8],fov:50,near:0.1,far:500}}
    onPointerMissed={()=>onSelect(null)} gl={{antialias:true,alpha:true}}>
    <color attach="background" args={["#101827"]}/>
    <ambientLight intensity={0.7}/>
    <directionalLight position={[6,12,7]} intensity={2} castShadow shadow-mapSize={[1024,1024]}/>
    <Grid position={[0,-0.02,0]} infiniteGrid cellColor="#334155" sectionColor="#52647e" fadeDistance={70}/>
    {scene.objects.map(item=><PrimitiveMesh key={item.id} item={item} selected={selectedId===item.id}
      onSelect={()=>onSelect(item.id)} overrides={overrides}/>)}
    <OrbitControls enableDamping makeDefault minDistance={1} maxDistance={90}/>
  </Canvas>
 </div>;
}
