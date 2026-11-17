"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState,type DragEvent} from "react";
import {Box,Circle,Layers3,Save,RefreshCw,Plus,Move3D} from "lucide-react";
import {loadStudioScene,saveStudioScene} from "@/app/builder/studio-actions";
import {validateScene,type StudioScene,type SceneObject,type Primitive,type Vec3} from "@/packages/engine-3d/src";
const Canvas=dynamic(()=>import("./PlayCanvasScene"),{ssr:false,loading:()=><div className="p-8 text-sm text-slate-300">Đang tải PlayCanvas...</div>});
type Loaded=Extract<Awaited<ReturnType<typeof loadStudioScene>>,{ok:true}>;
const primitives:Primitive[]=["box","sphere","plane"];
const make=(type:Primitive,x=0,z=0):SceneObject=>({id:crypto.randomUUID(),primitive:type,position:[x,type==="box"?0.7:type==="sphere"?0.55:0.07,z],rotation:type==="plane"?[-90,0,0]:[0,0,0],scale:type==="plane"?[2,2,2]:[1.3,1.3,1.3],material:{color:"#f97316",roughness:0.55,metalness:0.12}});
export default function PlayCanvasStudio({projectId,pageId,projectName}:{projectId:string;pageId:string;projectName:string}){
 const [loaded,setLoaded]=useState<Loaded|null>(null);
 const [scene,setScene]=useState<StudioScene|null>(null);
 const [selected,setSelected]=useState<string|null>(null);
 const [state,setState]=useState<"loading"|"saved"|"dirty"|"saving"|"error">("loading");
 const [notice,setNotice]=useState("");
 const version=useRef(1),saving=useRef(false),current=useRef<StudioScene|null>(null),snapshot=useRef("");
 const load=useCallback(async()=>{
  setState("loading");setNotice("");
  const result=await loadStudioScene(projectId,pageId);
  if(!result.ok){setState("error");setNotice(result.error);return;}
  setLoaded(result);setScene(result.scene);current.current=result.scene;version.current=result.sceneVersion;
  snapshot.current=JSON.stringify(result.scene);setSelected(result.scene.objects[0]?.id??null);setState("saved");
 },[projectId,pageId]);
 useEffect(()=>{void load();},[load]);
 const commit=useCallback((change:(before:StudioScene)=>StudioScene)=>{
  setScene(before=>{if(!before)return before;const next=change(before);if(!validateScene(next))return before;current.current=next;setState("dirty");return next;});
 },[]);
 const add=useCallback((primitive:Primitive,x=0,z=0)=>{
  const item=make(primitive,x,z);
  commit(scene=>({...scene,objects:[...scene.objects,item]}));setSelected(item.id);
 },[commit]);
 const save=useCallback(async()=>{
  if(!loaded||saving.current||!current.current)return;
  saving.current=true;setState("saving");setNotice("");
  try{
   for(let i=0;i<3;i++){
    const next=current.current;
    if(!next||snapshot.current===JSON.stringify(next))break;
    const result=await saveStudioScene(loaded.sceneId,next,version.current);
    if(!result.ok)throw Error(result.error);
    snapshot.current=JSON.stringify(next);version.current=result.version;
   }
   setState(snapshot.current===JSON.stringify(current.current)?"saved":"dirty");
   setNotice("Scene đã lưu trong Supabase studio_scenes.");
  }catch(e){setState("error");setNotice(e instanceof Error?e.message:"Lưu thất bại");}
  finally{saving.current=false;}
 },[loaded]);
 useEffect(()=>{
  if(!scene||!loaded||snapshot.current===JSON.stringify(scene))return;
  const timer=window.setTimeout(()=>void save(),1800);
  return()=>window.clearTimeout(timer);
 },[scene,loaded,save]);
 const edit=(field:"position"|"rotation"|"scale",index:0|1|2,value:number)=>{
  if(!selected||!Number.isFinite(value)||Math.abs(value)>10000)return;
  commit(s=>({...s,objects:s.objects.map(o=>o.id!==selected?o:{...o,[field]:o[field].map((v,i)=>i===index?value:v) as unknown as Vec3})}));
 };
 const picked=scene?.objects.find(x=>x.id===selected);
 const drag=(event:DragEvent<HTMLElement>,primitive:Primitive)=>{event.dataTransfer.setData("application/x-nuvoracraft-primitive",primitive);event.dataTransfer.effectAllowed="copy";};
 const drop=(event:DragEvent<HTMLDivElement>)=>{
  event.preventDefault();const type=event.dataTransfer.getData("application/x-nuvoracraft-primitive") as Primitive;
  if(!primitives.includes(type))return;
  const bounds=event.currentTarget.getBoundingClientRect();
  const x=Number((((event.clientX-bounds.left)/bounds.width-0.5)*9).toFixed(2));
  const z=Number((((event.clientY-bounds.top)/bounds.height-0.5)*7).toFixed(2));
  add(type,x,z);
 };
 return <div className="min-h-[calc(100dvh-70px)] bg-[#0b1323] text-white">
  <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div><p className="text-xs font-bold uppercase tracking-widest text-orange-300">PlayCanvas Engine · 3D</p><h1 className="text-2xl font-black">{projectName}</h1></div>
    <div className="flex flex-wrap gap-2"><Link href={"/game-builder?project="+encodeURIComponent(projectId)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm">← Game Builder 2D</Link><button type="button" onClick={()=>void load()} className="rounded-lg border border-slate-600 px-3 py-2" title="Tải lại từ Supabase"><RefreshCw size={17}/></button><button type="button" disabled={!loaded||state==="saving"||state==="saved"} onClick={()=>void save()} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold disabled:opacity-50"><Save size={16}/> Lưu Scene</button></div>
   </div>
   {notice&&<p role="status" className={"mt-3 text-sm "+(state==="error"?"text-rose-300":"text-emerald-300")}>{notice}</p>}
   <div className="mt-5 grid min-h-[580px] gap-4 lg:grid-cols-[185px_minmax(0,1fr)_260px]">
    <aside className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
     <h2 className="mb-4 text-sm font-bold">3D Objects</h2>
     <p className="mb-3 text-xs leading-5 text-slate-400">Kéo vật thể vào sân hoặc chạm để thêm trên Android.</p>
     <div className="space-y-2">{primitives.map(type=><button key={type} type="button" draggable onDragStart={e=>drag(e,type)} onClick={()=>add(type)} className="flex w-full cursor-grab items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-3 text-left text-sm hover:border-orange-400">
      {type==="box"?<Box size={17}/>:type==="sphere"?<Circle size={17}/>:<Layers3 size={17}/>} {type}<Plus className="ml-auto" size={14}/></button>)}</div>
     <p className="mt-5 text-xs text-slate-400">{scene?.objects.length??0} objects · {state}</p>
     <nav aria-label="Scene objects" className="mt-3 max-h-64 space-y-1 overflow-y-auto">{scene?.objects.map((o,i)=><button key={o.id} type="button" onClick={()=>setSelected(o.id)} className={"w-full rounded-md px-2 py-2 text-left text-xs "+(o.id===selected?"bg-orange-600":"bg-slate-800")}>{i+1}. {o.primitive}</button>)}</nav>
    </aside>
    <div className="relative min-h-[400px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950" onDragOver={event=>event.preventDefault()} onDrop={drop}>
     {scene?<Canvas scene={scene} selectedId={selected} onSelect={setSelected}/>:<div className="p-7 text-slate-400">Đang tải dữ liệu scene từ Supabase...</div>}
     <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl bg-slate-950/80 p-3 text-xs text-slate-300"><Move3D className="mr-2 inline" size={16}/> Thả khối vào scene · Chỉnh XYZ trong Properties</div>
    </div>
    <aside className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
     <h2 className="mb-4 text-sm font-bold">Properties</h2>
     {!picked?<p className="text-xs text-slate-400">Chọn vật thể để sửa.</p>:<>
      <p className="mb-4 text-xs text-orange-300">{picked.primitive} · {picked.id.slice(0,8)}</p>
      {(["position","rotation","scale"] as const).map(field=><fieldset key={field} className="mb-4"><legend className="mb-2 text-xs font-bold capitalize">{field}</legend>
       <div className="grid grid-cols-3 gap-2">{(["X","Y","Z"] as const).map((axis,i)=><label key={axis} className="text-[10px] text-slate-400">{axis}<input type="number" step="0.1" min="-100" max="100" value={picked[field][i]} onChange={e=>edit(field,i as 0|1|2,Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-2 text-sm text-white"/></label>)}</div>
      </fieldset>)}
      <label className="block text-xs">Color<input aria-label="Màu vật thể" type="color" value={picked.material.color} onChange={e=>commit(s=>({...s,objects:s.objects.map(o=>o.id===picked.id?{...o,material:{...o.material,color:e.target.value}}:o)}))} className="mt-2 block h-10 w-full"/></label>
      <button type="button" className="mt-6 w-full rounded-lg border border-rose-700 px-3 py-2 text-xs text-rose-200" onClick={()=>{commit(s=>({...s,objects:s.objects.filter(o=>o.id!==selected)}));setSelected(null);}}>Xóa vật thể đã chọn</button>
     </>}
    </aside>
   </div>
  </div>
 </div>;
}
