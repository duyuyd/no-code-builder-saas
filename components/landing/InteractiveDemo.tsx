"use client";
import {useState} from "react";
import {DndContext,useDraggable,useDroppable,PointerSensor,TouchSensor,useSensors,useSensor,type DragEndEvent} from "@dnd-kit/core";
import {motion,AnimatePresence} from "framer-motion";
import {ArrowUpRight,GripVertical,Plus,RotateCcw} from "lucide-react";
import {COMPONENT_REGISTRY} from "@/lib/component-registry";
const available=COMPONENT_REGISTRY.filter(x=>["heading","paragraph","button","image"].includes(x.type));
function PaletteItem({type,label}:{type:string;label:string}){
 const {attributes,listeners,setNodeRef,transform,isDragging}=useDraggable({id:"marketing-"+type,data:{type}});
 return <button type="button" ref={setNodeRef} {...listeners} {...attributes}
 style={{transform:transform?`translate3d(${transform.x}px,${transform.y}px,0)`:undefined}}
 className={"flex w-full touch-none items-center justify-between rounded-xl border px-3 py-3 text-left text-xs font-semibold "+(isDragging?"z-20 border-orange-400 bg-orange-400 text-black":"border-white/10 bg-white/5 text-slate-300 hover:border-orange-400/50")}>
  {label}<GripVertical size={14}/>
 </button>;
}
export default function InteractiveDemo(){
 const [blocks,setBlocks]=useState<string[]>(["heading","paragraph","button"]);
 const [active,setActive]=useState<string|null>(null);
 const {setNodeRef,isOver}=useDroppable({id:"marketing-canvas"});
 const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(TouchSensor,{activationConstraint:{delay:120,tolerance:8}}));
 const insert=(type:string)=>setBlocks(prev=>prev.length<8?[...prev,type]:prev);
 const onDrop=(e:DragEndEvent)=>{const type=e.active.data.current?.type;if(e.over?.id==="marketing-canvas"&&typeof type==="string")insert(type);setActive(null);};
 return <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[#0b1325] shadow-[0_30px_100px_rgba(0,0,0,.4)]">
  <div className="flex items-center justify-between border-b border-white/10 bg-white/[.035] px-5 py-3 text-xs text-slate-400"><span>● <span className="ml-2">Visual canvas · Live demo</span></span><span className="rounded-md bg-emerald-400/10 px-2 py-1 text-emerald-300">Interactive</span></div>
  <DndContext sensors={sensors} onDragStart={e=>setActive(String(e.active.data.current?.type??""))} onDragEnd={onDrop} onDragCancel={()=>setActive(null)}>
   <div className="grid min-h-[365px] grid-cols-[112px_minmax(0,1fr)] gap-2 p-3 sm:grid-cols-[145px_minmax(0,1fr)] sm:gap-4 sm:p-5">
    <div className="space-y-2"><div className="pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Blocks</div>
     {available.map(x=><PaletteItem key={x.type} type={x.type} label={x.label}/>)}
     <button onClick={()=>setBlocks([])} className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"><RotateCcw size={13}/> Reset canvas</button>
    </div>
    <div ref={setNodeRef} className={"relative min-w-0 rounded-2xl border-2 border-dashed bg-[#f8fafc] p-4 transition sm:p-6 "+(isOver?"border-orange-400":"border-slate-300")}>
     <div className="mb-4 flex items-center justify-between text-[10px] font-bold text-slate-400"><span>HOME PAGE</span><span>↗</span></div>
     <AnimatePresence>{blocks.map((type,i)=><motion.div key={type+"-"+i} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.95}} className="mb-2">
      {type==="heading"?<h3 className="text-xl font-black text-slate-900 sm:text-2xl">Your idea. Your website.</h3>:
       type==="paragraph"?<p className="text-xs leading-5 text-slate-600">A visual canvas where you can build, move and shape the blocks.</p>:
       type==="button"?<div className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white">Get started <ArrowUpRight size={13}/></div>:
       <div className="flex h-16 items-center justify-center rounded-xl bg-gradient-to-r from-orange-100 via-amber-50 to-blue-100 text-[10px] text-slate-500">Image placeholder</div>}
     </motion.div>)}</AnimatePresence>
     {!blocks.length&&<div className="flex min-h-[160px] items-center justify-center gap-2 text-xs text-slate-400"><Plus size={16}/> Drag blocks here</div>}
     {active&&<div className="pointer-events-none absolute bottom-3 right-3 rounded bg-orange-500/10 px-3 py-2 text-[10px] font-bold text-orange-600">Drop to add {active}</div>}
    </div>
   </div>
  </DndContext>
  <p className="border-t border-white/10 px-5 py-3 text-[10px] text-slate-500">Try it: drag components into the canvas. This sandbox is temporary; your actual projects are saved in Studio.</p>
 </div>;
}
