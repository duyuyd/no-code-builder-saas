"use client";
import {useCallback,useEffect,useRef,useState,type PointerEvent,type WheelEvent} from "react";
import {Camera,Move3D,ZoomIn,ZoomOut,RotateCcw,AlertTriangle} from "lucide-react";
import type {CharacterModel} from "@/lib/character-model";
import {createCharacterRenderer,type CharacterRenderer,type CameraView} from "@/lib/character-webgl";
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export default function CharacterViewport({model,camera,onCameraChange,playing}:{
 model:CharacterModel;camera:CameraView;onCameraChange:(next:CameraView)=>void;playing:boolean;
}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const engine=useRef<CharacterRenderer|null>(null);
 const pointerMap=useRef(new Map<number,{x:number;y:number}>());
 const [error,setError]=useState("");
 const [frame,setFrame]=useState(0);
 const drawRef=useRef({model,camera,playing});
 drawRef.current={model,camera,playing};
 const draw=useCallback(()=>engine.current?.draw(drawRef.current.model,drawRef.current.camera,0),[]);
 useEffect(()=>{
  const element=canvas.current;if(!element)return;
  let observer:ResizeObserver|null=null;
  try{
   engine.current=createCharacterRenderer(element);
   draw();
   observer=new ResizeObserver(()=>draw());
   observer.observe(element);
   const restore=()=>{try{engine.current?.dispose();engine.current=createCharacterRenderer(element);draw();setError("");}catch(e){setError(e instanceof Error?e.message:"Không khôi phục được WebGL");}};
   const lost=(e:Event)=>{e.preventDefault();setError("Thiết bị tạm mất ngữ cảnh WebGL. Đang khôi phục khi hệ thống sẵn sàng.");};
   element.addEventListener("webglcontextlost",lost);
   element.addEventListener("webglcontextrestored",restore);
   return ()=>{observer?.disconnect();element.removeEventListener("webglcontextlost",lost);element.removeEventListener("webglcontextrestored",restore);engine.current?.dispose();engine.current=null;};
  }catch(e){setError(e instanceof Error?e.message:"Không mở được môi trường 3D");return ()=>{observer?.disconnect();};}
 },[draw]);
 useEffect(()=>{
  if(!engine.current)return;
  if(!playing){draw();return;}
  let raf=0,last=0;
  const step=(time:number)=>{
   if(time-last>=32&&document.visibilityState==="visible"){
    engine.current?.draw(drawRef.current.model,drawRef.current.camera,time/1000);
    last=time;
   }
   raf=requestAnimationFrame(step);
  };
  raf=requestAnimationFrame(step);
  return ()=>cancelAnimationFrame(raf);
 },[model,camera,playing,draw]);
 const update=(yawDelta:number,pitchDelta:number,zoomDelta=0)=>{
  onCameraChange({yaw:camera.yaw+yawDelta,pitch:clamp(camera.pitch+pitchDelta,-1.42,1.42),distance:clamp(camera.distance+zoomDelta,4.5,16)});
 };
 const down=(event:PointerEvent<HTMLCanvasElement>)=>{
  pointerMap.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
  event.currentTarget.setPointerCapture(event.pointerId);
 };
 const move=(event:PointerEvent<HTMLCanvasElement>)=>{
  const previous=pointerMap.current.get(event.pointerId);
  if(!previous)return;
  const current={x:event.clientX,y:event.clientY};
  if(pointerMap.current.size>=2){
   const other=[...pointerMap.current.entries()].find(([id])=>id!==event.pointerId)?.[1];
   if(other){
    const oldDistance=Math.hypot(previous.x-other.x,previous.y-other.y);
    const newDistance=Math.hypot(current.x-other.x,current.y-other.y);
    update(0,0,(oldDistance-newDistance)*.028);
   }
  }else update((current.x-previous.x)*.012,-(current.y-previous.y)*.008);
  pointerMap.current.set(event.pointerId,current);
 };
 const up=(event:PointerEvent<HTMLCanvasElement>)=>{pointerMap.current.delete(event.pointerId);};
 const wheel=(event:WheelEvent<HTMLCanvasElement>)=>{event.preventDefault();update(0,0,event.deltaY*.007);};
 const screenshot=()=>{
  try{
   const element=canvas.current;if(!element||!engine.current)return;
   engine.current.draw(model,camera,0);
   const a=document.createElement("a");a.href=element.toDataURL("image/png");a.download="nhan-vat-webgl-3d.png";a.click();setFrame(n=>n+1);
  }catch(e){setError(e instanceof Error?e.message:"Không thể lưu ảnh");}
 };
 return <div className="relative w-full">
  <canvas ref={canvas} aria-label="WebGL 3D - giữ và kéo để xoay, hai ngón để phóng to hoặc thu nhỏ"
   className="block h-[400px] w-full cursor-grab select-none active:cursor-grabbing sm:h-[520px]"
   style={{touchAction:"none"}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onWheel={wheel}/>
  {error&&<div role="alert" className="absolute inset-x-3 top-4 rounded-xl border border-amber-600 bg-slate-950/90 p-4 text-xs text-amber-200"><AlertTriangle size={18} className="mb-2"/>{error}<p className="mt-2">Thử bật tăng tốc phần cứng trong Chrome hoặc cập nhật trình duyệt. Dữ liệu nhân vật đã lưu không bị ảnh hưởng.</p></div>}
  <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-emerald-500/40 bg-slate-950/75 px-2 py-1 text-[10px] font-bold text-emerald-300"><Move3D size={12} className="mr-1 inline"/> WebGL GPU • 3D có chiều sâu</div>
  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
   <button type="button" onClick={()=>update(0,0,-1)} aria-label="Phóng to nhân vật" className="rounded-lg border border-slate-500/60 bg-slate-950/75 p-2 text-white"><ZoomIn size={19}/></button>
   <button type="button" onClick={()=>update(0,0,1)} aria-label="Thu nhỏ nhân vật" className="rounded-lg border border-slate-500/60 bg-slate-950/75 p-2 text-white"><ZoomOut size={19}/></button>
   <button type="button" onClick={()=>onCameraChange({yaw:.35,pitch:.13,distance:8})} aria-label="Đặt lại góc nhìn" className="rounded-lg border border-slate-500/60 bg-slate-950/75 p-2 text-white"><RotateCcw size={19}/></button>
   <button type="button" onClick={screenshot} className="ml-auto flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white"><Camera size={17}/> Chụp PNG</button>
  </div>
  <span className="sr-only" aria-live="polite">{frame>0?"Đã xuất ảnh 3D.":""}</span>
 </div>;
}
