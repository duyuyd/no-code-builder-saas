"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Circle, Layers3, LoaderCircle, Save, Play, Pause, RotateCcw, Plus, RefreshCcw } from "lucide-react";
import { loadStudioScene, saveStudioScene, saveStudioTimeline } from "@/app/builder/studio-actions";
import { evaluateTimeline, type Timeline, type AnimationPath } from "@/packages/engine-4d/src";
import { type SceneObject, type StudioScene, type Primitive, type Vec3 } from "@/packages/engine-3d/src";
const ThreeCanvas=dynamic(()=>import("./ThreeCanvas"),{ssr:false,loading:()=> <p role="status" className="p-5 text-slate-300">Đang khởi tạo WebGL…</p>});
type Loaded=Extract<Awaited<ReturnType<typeof loadStudioScene>>,{ok:true}>;
const vectors=["position","rotation","scale"] as const;
const coords=["x","y","z"] as const;
const number=(n:number)=>Number.isFinite(n)?Math.min(10000,Math.max(-10000,n)):0;
export default function ThreeStudio({projectId,pageId,showTimeline}:{projectId:string;pageId:string;showTimeline:boolean}){
 const [loaded,setLoaded]=useState<Loaded|null>(null);
 const [scene,setScene]=useState<StudioScene|null>(null);
 const [timeline,setTimeline]=useState<Timeline|null>(null);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [timeMs,setTimeMs]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [saveState,setSaveState]=useState<"saved"|"saving"|"dirty"|"error">("saved");
 const [message,setMessage]=useState("");
 const sceneRef=useRef<StudioScene|null>(null);
 const timelineRef=useRef<Timeline|null>(null);
 const savedScene=useRef("");
 const savedTimeline=useRef("");
 const sceneVersion=useRef(1);
 const timelineVersion=useRef(1);
 const saving=useRef(false);
 const load=useCallback(async()=>{
  setMessage("");
  const r=await loadStudioScene(projectId,pageId);
  if(!r.ok){setMessage(r.error);return;}
  setLoaded(r);setScene(r.scene);setTimeline(r.timeline);
  sceneRef.current=r.scene;timelineRef.current=r.timeline;
  savedScene.current=JSON.stringify(r.scene);savedTimeline.current=JSON.stringify(r.timeline);
  sceneVersion.current=r.sceneVersion;timelineVersion.current=r.timelineVersion;
  setSelectedId(r.scene.objects[0]?.id??null);setSaveState("saved");
 },[projectId,pageId]);
 useEffect(()=>{void load();},[load]);
 const persist=useCallback(async()=>{
  if(!loaded||saving.current)return;
  saving.current=true;setSaveState("saving");
  try{
   for(let attempt=0;attempt<4;attempt++){
    const s=sceneRef.current,t=timelineRef.current;
    if(s&&savedScene.current!==JSON.stringify(s)){
     const result=await saveStudioScene(loaded.sceneId,s,sceneVersion.current);
     if(!result.ok)throw new Error(result.error);
     sceneVersion.current=result.version;savedScene.current=JSON.stringify(s);
    }
    if(t&&savedTimeline.current!==JSON.stringify(t)){
     const result=await saveStudioTimeline(loaded.timelineId,t,timelineVersion.current);
     if(!result.ok)throw new Error(result.error);
     timelineVersion.current=result.version;savedTimeline.current=JSON.stringify(t);
    }
    if(savedScene.current===JSON.stringify(sceneRef.current)&&savedTimeline.current===JSON.stringify(timelineRef.current))break;
   }
   const finished=savedScene.current===JSON.stringify(sceneRef.current)&&savedTimeline.current===JSON.stringify(timelineRef.current);
   setSaveState(finished?"saved":"dirty");setMessage(finished?"Đã lưu vào Supabase.":"Có thay đổi mới chưa kịp lưu.");
  }catch(error){setSaveState("error");setMessage(error instanceof Error?error.message:"Lưu thất bại.");}
  finally{saving.current=false;}
 },[loaded]);
 useEffect(()=>{
  sceneRef.current=scene;timelineRef.current=timeline;
  if(!loaded||!scene||!timeline)return;
  if(savedScene.current===JSON.stringify(scene)&&savedTimeline.current===JSON.stringify(timeline))return;
  setSaveState("dirty");
  const timer=window.setTimeout(()=>void persist(),2000);
  return ()=>window.clearTimeout(timer);
 },[scene,timeline,loaded,persist]);
 useEffect(()=>{
  if(!playing||!timeline)return;
  let raf=0;const initial=performance.now()-timeMs;
  const tick=(now:number)=>{
   const duration=Math.max(1,timeline.durationMs);
   setTimeMs(Math.round((now-initial)%duration));
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  return ()=>cancelAnimationFrame(raf);
 },[playing,timeline?.durationMs]);
 const selected=scene?.objects.find(o=>o.id===selectedId)??null;
 const evaluated=useMemo(()=>timeline?evaluateTimeline(timeline,timeMs):{},[timeline,timeMs]);
 const updateObject=(id:string,change:(value:SceneObject)=>SceneObject)=>{
  setScene(prev=>prev?{...prev,objects:prev.objects.map(o=>o.id===id?change(o):o)}:prev);
 };
 const addObject=(primitive:Primitive)=>{
  if(!scene||scene.objects.length>=1500)return;
  const id=crypto.randomUUID();
  setScene({...scene,objects:[...scene.objects,{
    id,primitive,position:[0,primitive==="plane"?0.01:0.5,0],
    rotation:primitive==="plane"?[-Math.PI/2,0,0]:[0,0,0],
    scale:primitive==="plane"?[4,4,1]:[1,1,1],
    material:{color:"#ea580c",roughness:0.6,metalness:0.1}
  }]});
  setSelectedId(id);
 };
 const addKeyframes=()=>{
  if(!timeline||!selected||timeMs>timeline.durationMs)return;
  const paths:AnimationPath[]=["position.x","position.y","position.z","rotation.x","rotation.y","rotation.z"];
  const remainder=timeline.keyframes.filter(k=>!(k.objectId===selected.id&&k.timeMs===timeMs&&paths.includes(k.path)));
  const newFrames=paths.map(path=>{
   const [group,coordinate]=path.split(".") as ["position"|"rotation","x"|"y"|"z"];
   const index=coords.indexOf(coordinate);
   return {id:crypto.randomUUID(),objectId:selected.id,path,timeMs,value:selected[group][index],interpolation:"linear" as const};
  });
  setTimeline({...timeline,keyframes:[...remainder,...newFrames]});
  setMessage("Đã tạo 6 keyframe cho vị trí và góc xoay.");
 };
 if(!loaded||!scene||!timeline)return <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 text-slate-200">
  {message?<div role="alert" className="rounded-lg border border-rose-500 p-4">{message}<button onClick={()=>void load()} className="ml-3 rounded bg-slate-700 px-3 py-2">Thử lại</button></div>:
  <p role="status" className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={18}/> Đang đọc scene từ Supabase…</p>}
 </main>;
 return <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0f172a] text-slate-100">
  <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-700 p-2 sm:p-3">
   <span className="mr-auto flex items-center gap-2 whitespace-nowrap text-sm font-bold"><Layers3 size={18}/> Studio 3D</span>
   <button onClick={()=>addObject("box")} className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-700 px-3 py-2 text-xs"><Box size={15}/>Box</button>
   <button onClick={()=>addObject("sphere")} className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-700 px-3 py-2 text-xs"><Circle size={15}/>Sphere</button>
   <button onClick={()=>addObject("plane")} className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-700 px-3 py-2 text-xs"><Plus size={15}/>Plane</button>
   <button onClick={()=>void persist()} disabled={saveState==="saving"} className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
    {saveState==="saving"?<LoaderCircle size={15} className="animate-spin"/>:<Save size={15}/>}{saveState==="saved"?"Đã lưu":"Lưu"}</button>
  </div>
  <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_275px] lg:overflow-hidden">
   <section className="flex min-h-[340px] flex-col p-2 sm:p-3 lg:min-h-0">
    <div className="min-h-[310px] flex-1">
     <ThreeCanvas scene={scene} selectedId={selectedId} onSelect={setSelectedId} timeline={timeline} timeMs={timeMs}/>
    </div>
    {message&&<p role={saveState==="error"?"alert":"status"} className={"mt-2 truncate px-1 text-xs "+(saveState==="error"?"text-rose-300":"text-emerald-300")}>{message}</p>}
   </section>
   <aside className="max-h-[40dvh] overflow-y-auto border-t border-slate-700 p-3 lg:max-h-none lg:border-l lg:border-t-0">
    <h2 className="mb-3 text-sm font-bold">Thuộc tính vật thể</h2>
    {selected?<div className="space-y-3">
      <p className="truncate text-xs text-slate-400">{selected.primitive} · {selected.id}</p>
      {vectors.map(axis=><fieldset key={axis} className="rounded-lg border border-slate-700 p-2">
       <legend className="px-1 text-xs capitalize text-orange-300">{axis}</legend>
       <div className="grid grid-cols-3 gap-2">{coords.map((coord,i)=><label key={coord} className="min-w-0 text-[10px] text-slate-400">{coord.toUpperCase()}
         <input type="number" step="0.1" min={axis==="scale"?"0.01":"-10000"} max="10000"
          className="mt-1 w-full min-w-0 rounded-md border border-slate-600 bg-slate-900 px-1.5 py-2 text-sm text-white"
          value={Number(selected[axis][i].toFixed(4))} onChange={e=>{
            const value=Number(e.target.value);if(!Number.isFinite(value)||axis==="scale"&&value<=0)return;
            updateObject(selected.id,o=>({...o,[axis]:o[axis].map((n,j)=>j===i?number(value):n) as unknown as Vec3}));
          }}/>
        </label>)}</div>
      </fieldset>)}
      <label className="block text-xs text-slate-300">Màu vật liệu
       <input type="color" value={selected.material.color} onChange={e=>updateObject(selected.id,o=>({...o,material:{...o.material,color:e.target.value}}))}
        className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-900 p-1"/>
      </label>
      <button onClick={()=>setScene(prev=>prev?{...prev,objects:prev.objects.filter(o=>o.id!==selected.id)}:prev)}
        className="rounded-lg border border-rose-700 px-3 py-2 text-xs text-rose-200">Xóa vật thể đã chọn</button>
     </div>:<p className="text-xs text-slate-400">Chọn vật thể trong 3D để chỉnh sửa.</p>}
   </aside>
  </div>
  <section className={"shrink-0 border-t border-slate-700 bg-[#1e293b] p-3 "+(showTimeline?"":"")}>
   <div className="mb-2 flex flex-wrap items-center gap-2">
    <span className="mr-auto text-xs font-bold">Timeline · {(timeMs/1000).toFixed(2)}s</span>
    <button onClick={()=>{setTimeMs(0);setPlaying(false)}} title="Về đầu" className="rounded border border-slate-600 p-2"><RotateCcw size={15}/></button>
    <button onClick={()=>setPlaying(x=>!x)} className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold">
      {playing?<Pause size={15}/>:<Play size={15}/>} {playing?"Tạm dừng":"Play"}</button>
    <button onClick={addKeyframes} disabled={!selected} className="flex items-center gap-1 rounded-lg border border-slate-500 px-3 py-2 text-xs font-semibold disabled:opacity-40"><Plus size={15}/> Keyframe</button>
    <button title="Đọc lại dữ liệu từ Supabase" onClick={()=>void load()} className="rounded border border-slate-600 p-2"><RefreshCcw size={15}/></button>
   </div>
   <input aria-label="Dòng thời gian (mili giây)" type="range" min={0} max={timeline.durationMs} step={10}
    className="w-full accent-orange-500" value={timeMs} onChange={e=>{setPlaying(false);setTimeMs(Number(e.target.value));}}/>
   <div className="flex justify-between text-[10px] text-slate-400"><span>0s</span><span>{timeline.keyframes.length} keyframe</span><span>{timeline.durationMs/1000}s</span></div>
  </section>
 </main>;
}
