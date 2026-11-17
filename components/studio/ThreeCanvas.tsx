"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { StudioScene, SceneObject, Vec3 } from "@/packages/engine-3d/src";
import type { Timeline } from "@/packages/engine-4d/src";
import { evaluateTimeline } from "@/packages/engine-4d/src";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WebGLRenderer } from "three";

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
type XrClient = { isSessionSupported(mode:string):Promise<boolean>; requestSession(mode:string,options?:object):Promise<unknown> };
function XRButtons({renderer}:{renderer:React.RefObject<WebGLRenderer|null>}){
 const [availability,setAvailability]=useState({ar:false,vr:false});
 const [message,setMessage]=useState("");
 useEffect(()=>{
  let active=true;
  const xr=(navigator as Navigator & {xr?:XrClient}).xr;
  if(!xr)return;
  Promise.all([xr.isSessionSupported("immersive-ar").catch(()=>false),xr.isSessionSupported("immersive-vr").catch(()=>false)])
   .then(([ar,vr])=>{if(active)setAvailability({ar,vr});});
  return ()=>{active=false;};
 },[]);
 const begin=async(mode:"immersive-ar"|"immersive-vr")=>{
  try{
   const xr=(navigator as Navigator & {xr?:XrClient}).xr;
   if(!xr||!renderer.current){setMessage("Thiết bị không hỗ trợ XR.");return;}
   const session=await xr.requestSession(mode,{optionalFeatures:["local-floor","bounded-floor"]});
   renderer.current.xr.enabled=true;
   await renderer.current.xr.setSession(session as Parameters<WebGLRenderer["xr"]["setSession"]>[0]);
   setMessage("");
  }catch{setMessage("Không khởi động được XR. Kiểm tra HTTPS, trình duyệt và quyền thiết bị.");}
 };
 return <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-2">
   {availability.ar&&<button type="button" className="pointer-events-auto rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white" onClick={()=>void begin("immersive-ar")}>View in AR</button>}
   {availability.vr&&<button type="button" className="pointer-events-auto rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white" onClick={()=>void begin("immersive-vr")}>View in VR</button>}
   {message&&<span role="alert" className="rounded-lg bg-rose-900/90 p-2 text-xs text-white">{message}</span>}
 </div>;
}
export default function ThreeCanvas({scene,selectedId,onSelect,timeline,timeMs}:Props){
 const renderer=useRef<WebGLRenderer|null>(null);
 const overrides=useMemo(()=>evaluateTimeline(timeline,timeMs),[timeline,timeMs]);
 return <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-xl border border-slate-700 bg-[#101827]">
  <Canvas shadows dpr={[1,1.6]} camera={{position:[7,5,8],fov:50,near:0.1,far:500}}
    onPointerMissed={()=>onSelect(null)} gl={{antialias:true,alpha:true}} onCreated={({gl})=>{renderer.current=gl;gl.xr.enabled=true;}}>
    <color attach="background" args={["#101827"]}/>
    <ambientLight intensity={0.7}/>
    <directionalLight position={[6,12,7]} intensity={2} castShadow shadow-mapSize={[1024,1024]}/>
    <Grid position={[0,-0.02,0]} infiniteGrid cellColor="#334155" sectionColor="#52647e" fadeDistance={70}/>
    {scene.objects.map(item=><PrimitiveMesh key={item.id} item={item} selected={selectedId===item.id}
      onSelect={()=>onSelect(item.id)} overrides={overrides}/>)}
    <OrbitControls enableDamping makeDefault minDistance={1} maxDistance={90}/>
  </Canvas>
  <XRButtons renderer={renderer}/>
 </div>;
}
