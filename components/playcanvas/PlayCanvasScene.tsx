"use client";
import {Application,Entity} from "@playcanvas/react";
import {Camera,Light,Render} from "@playcanvas/react/components";
import {OrbitControls} from "@playcanvas/react/scripts";
import {useMaterial} from "@playcanvas/react/hooks";
import type {SceneObject,StudioScene} from "@/packages/engine-3d/src";
function Shape({item,selected,onSelect}:{item:SceneObject;selected:boolean;onSelect:()=>void}){
 const material=useMaterial({diffuse:selected?"#ffbb66":item.material.color});
 return <Entity name={item.id} position={[...item.position]} rotation={[...item.rotation]} scale={[...item.scale]} onClick={onSelect}>
  <Render type={item.primitive} material={material}/>
 </Entity>;
}
function Floor(){
 const material=useMaterial({diffuse:"#334155"});
 return <Entity name="floor" position={[0,-0.08,0]} scale={[24,0.14,24]}><Render type="box" material={material}/></Entity>;
}
export default function PlayCanvasScene({scene,selectedId,onSelect}:{scene:StudioScene;selectedId:string|null;onSelect:(id:string)=>void}){
 return <div className="h-full min-h-80 w-full" aria-label="PlayCanvas 3D scene">
  <Application fillMode="FILL_WINDOW" resolutionMode="AUTO">
   <Entity name="camera" position={[6,6,9]}><Camera clearColor="#0b1323" fov={60}/><OrbitControls/></Entity>
   <Entity name="sun" position={[4,9,3]} rotation={[35,30,0]}><Light type="directional" intensity={2.7}/></Entity>
   <Entity name="ambient" position={[-5,6,-4]}><Light type="omni" intensity={0.7} range={28}/></Entity>
   <Floor/>
   {scene.objects.map(item=><Shape key={item.id} item={item} selected={item.id===selectedId} onSelect={()=>onSelect(item.id)}/>)}
  </Application>
 </div>;
}
