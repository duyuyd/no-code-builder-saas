"use client";
import {useCallback,useEffect,useRef,useState,type PointerEvent} from "react";
import {RotateCcw,Trophy,Timer,Coins,Gamepad2,ArrowUp,ArrowDown,ArrowLeft,ArrowRight} from "lucide-react";
import {boxesOverlap,gameSize,type GameObject,type GameScene} from "@/lib/game-scene";
type State={x:number;y:number;collected:string[];won:boolean;started:boolean;seconds:number;steps:number};
const initial=(scene:GameScene):State=>({x:scene.player.x,y:scene.player.y,collected:[],won:false,started:false,seconds:0,steps:0});
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const vector:Record<string,[number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
export default function GameStage({scene,mode,onMoveObject,onMoveEnd,onAddObject,onSelect,selectedId}:{
 scene:GameScene;mode:"edit"|"play";
 onMoveObject?:(id:string,x:number,y:number)=>void;onMoveEnd?:()=>void;
 onAddObject?:(x:number,y:number)=>void;onSelect?:(id:string|null)=>void;selectedId?:string|null
}){
 const [state,setState]=useState<State>(()=>initial(scene));
 const keys=useRef(new Set<string>());
 const stageRef=useRef<HTMLDivElement>(null);
 const dragging=useRef<string|null>(null);
 useEffect(()=>{setState(initial(scene));},[scene,mode]);
 const move=useCallback((dx:number,dy:number)=>{
  if(mode!=="play")return;
  setState(prev=>{
   if(prev.won)return prev;
   const x=clamp(prev.x+dx*scene.player.speed,0,100-gameSize.playerW);
   const y=clamp(prev.y+dy*scene.player.speed,0,100-gameSize.playerH);
   const player={x,y,w:gameSize.playerW,h:gameSize.playerH};
   if(scene.objects.some(o=>o.kind==="wall"&&boxesOverlap(player,o)))return prev;
   const added=scene.objects.filter(o=>o.kind==="coin"&&boxesOverlap(player,o)).map(o=>o.id);
   const collected=[...new Set([...prev.collected,...added])];
   const all=scene.objects.filter(o=>o.kind==="coin").every(o=>collected.includes(o.id));
   const goal=scene.objects.find(o=>o.kind==="goal"&&boxesOverlap(player,o));
   return {...prev,x,y,collected,won:!!goal&&all,started:true,steps:prev.steps+1};
  });
 },[scene,mode]);
 useEffect(()=>{
  if(mode!=="play")return;
  const onKeyDown=(e:KeyboardEvent)=>{
   if(!(e.key in vector))return;
   if(["INPUT","TEXTAREA","SELECT"].includes((e.target as HTMLElement)?.tagName))return;
   e.preventDefault();keys.current.add(e.key);
  };
  const onKeyUp=(e:KeyboardEvent)=>{keys.current.delete(e.key);};
  window.addEventListener("keydown",onKeyDown);
  window.addEventListener("keyup",onKeyUp);
  const timer=window.setInterval(()=>{
   for(const key of keys.current){const v=vector[key];if(v)move(v[0],v[1]);}
  },70);
  return ()=>{window.removeEventListener("keydown",onKeyDown);window.removeEventListener("keyup",onKeyUp);window.clearInterval(timer);keys.current.clear();};
 },[move,mode]);
 useEffect(()=>{
  if(mode!=="play"||!state.started||state.won)return;
  const timer=window.setInterval(()=>setState(prev=>({...prev,seconds:prev.seconds+1})),1000);
  return ()=>window.clearInterval(timer);
 },[mode,state.started,state.won]);
 function position(e:PointerEvent,object?:GameObject){
  const rect=stageRef.current?.getBoundingClientRect();
  if(!rect)return null;
  const x=(e.clientX-rect.left)/rect.width*100-(object?.w??0)/2;
  const y=(e.clientY-rect.top)/rect.height*100-(object?.h??0)/2;
  return {x:clamp(Math.round(x*10)/10,0,100-(object?.w??4)),y:clamp(Math.round(y*10)/10,0,100-(object?.h??6))};
 }
 const handleStageDown=(e:PointerEvent<HTMLDivElement>)=>{
  if(mode!=="edit"||e.target!==e.currentTarget)return;
  const at=position(e);if(at)onAddObject?.(at.x,at.y);
 };
 const direction=(key:string)=>({
  onPointerDown:(e:PointerEvent<HTMLButtonElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);const v=vector[key];if(v)move(v[0],v[1]);},
  onPointerUp:()=>keys.current.delete(key),
  onPointerCancel:()=>keys.current.delete(key),
  onLostPointerCapture:()=>keys.current.delete(key)
 });
 const coins=scene.objects.filter(o=>o.kind==="coin").length;
 return <section className="w-full min-w-0">
  {mode==="play"&&<div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-[#1e293b] p-3 text-sm text-white">
    <span className="flex items-center gap-2"><Coins size={16} className="text-amber-400"/>{state.collected.length}/{coins} sao</span>
    <span className="flex items-center gap-2"><Timer size={16} className="text-orange-400"/>{state.seconds}s</span>
    <span className="text-slate-300">{state.steps} bước</span>
    <button onClick={()=>setState(initial(scene))} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs text-orange-200"><RotateCcw size={14}/> Chơi lại</button>
   </div>}
  <div ref={stageRef} onPointerDown={handleStageDown}
   className={"relative isolate mx-auto aspect-[3/2] w-full touch-none select-none overflow-hidden rounded-2xl border-2 border-slate-600 shadow-2xl "+(mode==="edit"?"cursor-crosshair":"")}
   style={{background:scene.background,backgroundImage:scene.backgroundImageUrl?`url("${scene.backgroundImageUrl}")`:undefined,backgroundSize:"cover",backgroundPosition:"center"}}>
   <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20" style={{backgroundImage:"linear-gradient(#fff2 1px,transparent 1px),linear-gradient(90deg,#fff2 1px,transparent 1px)",backgroundSize:"10% 10%"}}/>
   {scene.objects.filter(o=>mode==="edit"||o.kind!=="coin"||!state.collected.includes(o.id)).map(o=>
    <div key={o.id} data-kind={o.kind}
     onPointerDown={e=>{
      if(mode!=="edit")return;
      e.stopPropagation();dragging.current=o.id;onSelect?.(o.id);e.currentTarget.setPointerCapture(e.pointerId);
     }}
     onPointerMove={e=>{
      if(mode!=="edit"||dragging.current!==o.id)return;
      const next=position(e,o);if(next)onMoveObject?.(o.id,next.x,next.y);
     }}
     onPointerUp={()=>{dragging.current=null;onMoveEnd?.();}}
     onPointerCancel={()=>{dragging.current=null;onMoveEnd?.();}}
     className={"absolute z-10 flex items-center justify-center rounded-md border text-center leading-none "+(mode==="edit"?"cursor-grab active:cursor-grabbing ":"pointer-events-none ")+(selectedId===o.id&&mode==="edit"?"border-orange-400 bg-orange-500/30 ring-2 ring-orange-400":"border-white/20 bg-white/10")}
     style={{left:o.x+"%",top:o.y+"%",width:o.w+"%",height:o.h+"%",fontSize:"clamp(15px,2.6vw,38px)"}}>{o.imageUrl?<img src={o.imageUrl} alt={o.label} draggable={false} className="pointer-events-none h-full w-full object-contain"/>:o.label|| (o.kind==="coin"?"⭐":o.kind==="goal"?"🏁":"🧱")}
    </div>
   )}
   <div className="pointer-events-none absolute z-20 flex items-center justify-center text-3xl sm:text-4xl" style={{
    left:(mode==="edit"?scene.player.x:state.x)+"%",top:(mode==="edit"?scene.player.y:state.y)+"%",
    width:gameSize.playerW+"%",height:gameSize.playerH+"%"}}>{scene.player.imageUrl?<img src={scene.player.imageUrl} alt="Nhân vật của người chơi" draggable={false} className="h-full w-full object-contain"/>:scene.player.emoji}</div>
   {mode==="play"&&state.won&&<div role="status" className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-slate-950/80 p-4 text-center text-white">
    <Trophy size={44} className="text-amber-400"/><h2 className="text-2xl font-black sm:text-4xl">Bạn đã chiến thắng! 🎉</h2><p className="text-sm">{coins} sao · {state.seconds} giây · {Math.max(0,coins*100-state.seconds*2)} điểm</p>
    <button onClick={()=>setState(initial(scene))} className="rounded-xl bg-orange-500 px-6 py-3 font-bold">Chơi ván mới</button>
   </div>}
  </div>
  {mode==="play"?<div className="mt-4 flex flex-col items-center gap-2">
   <p className="mb-1 flex items-center gap-2 text-xs text-slate-400"><Gamepad2 size={15}/> Dùng WASD, các phím mũi tên hoặc nút cảm ứng. Thu thập tất cả sao rồi tới 🏁.</p>
   <button {...direction("ArrowUp")} aria-label="Đi lên" className="flex size-12 touch-none items-center justify-center rounded-xl bg-slate-700 text-white active:bg-orange-500"><ArrowUp/></button>
   <div className="flex gap-2">
    <button {...direction("ArrowLeft")} aria-label="Đi trái" className="flex size-12 touch-none items-center justify-center rounded-xl bg-slate-700 text-white active:bg-orange-500"><ArrowLeft/></button>
    <button {...direction("ArrowDown")} aria-label="Đi xuống" className="flex size-12 touch-none items-center justify-center rounded-xl bg-slate-700 text-white active:bg-orange-500"><ArrowDown/></button>
    <button {...direction("ArrowRight")} aria-label="Đi phải" className="flex size-12 touch-none items-center justify-center rounded-xl bg-slate-700 text-white active:bg-orange-500"><ArrowRight/></button>
   </div>
  </div>:<p className="mt-3 text-center text-xs text-slate-400">Chọn loại đối tượng rồi chạm vào màn chơi để thêm. Kéo vật thể để đổi vị trí.</p>}
 </section>;
}
