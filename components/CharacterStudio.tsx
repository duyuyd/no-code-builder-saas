"use client";
import {useEffect,useRef,useState,type PointerEvent} from "react";
import {Camera,CheckCircle2,Download,Move3D,Pause,Play,RotateCcw,Save,Trash2} from "lucide-react";
import {type CharacterModel} from "@/lib/character-model";
import {saveCharacter,deleteCharacter} from "@/app/characters/actions";

type Vec={x:number;y:number;z:number};
type Face={vertices:Vec[];color:string;depth:number};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const shade=(hex:string,k:number)=>{
 const n=parseInt(hex.slice(1),16),r=clamp(Math.round(((n>>16)&255)*k),0,255),g=clamp(Math.round(((n>>8)&255)*k),0,255),b=clamp(Math.round((n&255)*k),0,255);
 return "rgb("+r+","+g+","+b+")";
};
function transform(p:Vec,yaw:number,pitch:number):Vec{
 const c=Math.cos(yaw),s=Math.sin(yaw),pc=Math.cos(pitch),ps=Math.sin(pitch);
 const x=p.x*c+p.z*s,z=-p.x*s+p.z*c,y=p.y-1.7;
 return {x,y:y*pc-z*ps,z:y*ps+z*pc};
}
function facesForBox(x:number,y:number,z:number,w:number,h:number,d:number,color:string,yaw:number,pitch:number):Face[]{
 const verts=[
 {x:x-w/2,y:y-h/2,z:z-d/2},{x:x+w/2,y:y-h/2,z:z-d/2},
 {x:x+w/2,y:y+h/2,z:z-d/2},{x:x-w/2,y:y+h/2,z:z-d/2},
 {x:x-w/2,y:y-h/2,z:z+d/2},{x:x+w/2,y:y-h/2,z:z+d/2},
 {x:x+w/2,y:y+h/2,z:z+d/2},{x:x-w/2,y:y+h/2,z:z+d/2}
 ].map(p=>transform(p,yaw,pitch));
 const groups:[[number,number,number,number],number][]=[
 [[4,5,6,7],1.05],[[1,0,3,2],.62],[[0,4,7,3],.75],
 [[5,1,2,6],.91],[[3,7,6,2],1.18],[[0,1,5,4],.50]
 ];
 return groups.map(([indices,k])=>({vertices:indices.map(i=>verts[i]),color:shade(color,k),depth:indices.reduce((sum,i)=>sum+verts[i].z,0)/4}));
}
function render(canvas:HTMLCanvasElement,m:CharacterModel,yaw:number,pitch:number,phase:number){
 const rect=canvas.getBoundingClientRect();
 if(rect.width<1||rect.height<1)return;
 const dpr=Math.min(window.devicePixelRatio||1,2);
 const w=rect.width,h=rect.height;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 }
 const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const gradient=ctx.createLinearGradient(0,0,0,h);
 gradient.addColorStop(0,"#1d2f48");gradient.addColorStop(1,"#08111f");
 ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle="rgba(148,163,184,.11)";ctx.lineWidth=1;
 for(let x=0;x<=w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
 for(let y=0;y<=h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 const focal=Math.min(w*1.35,h*.95);
 const project=(v:Vec)=>{const f=focal/(5-v.z);return {x:w/2+v.x*f,y:h*.51-v.y*f};};
 ctx.fillStyle="rgba(0,0,0,.38)";ctx.beginPath();ctx.ellipse(w/2,h*.82,w*.22,h*.043,0,0,Math.PI*2);ctx.fill();
 const swing=Math.sin(phase)*.24;
 const parts:{x:number;y:number;z:number;w:number;h:number;d:number;color:string}[]=[
 {x:0,y:2.07,z:0,w:1.12*m.bodyWidth,h:1.25,d:.55,color:m.outfit},
 {x:0,y:2.76,z:0,w:.38,h:.25,d:.35,color:m.skin},
 {x:0,y:3.28,z:0,w:.90*m.headSize,h:.95*m.headSize,d:.77*m.headSize,color:m.skin},
 {x:0,y:3.77*m.headSize+(3.28-3.28*m.headSize),z:0,w:.96*m.headSize,h:.22*m.headSize,d:.80*m.headSize,color:m.hair},
 {x:-.78*m.bodyWidth,y:2.11+swing,z:0,w:.34,h:1.11*m.armLength,d:.42,color:m.outfit},
 {x:.78*m.bodyWidth,y:2.11-swing,z:0,w:.34,h:1.11*m.armLength,d:.42,color:m.outfit},
 {x:-.32*m.bodyWidth,y:.81-swing,z:0,w:.44,h:1.25*m.legLength,d:.45,color:m.pants},
 {x:.32*m.bodyWidth,y:.81+swing,z:0,w:.44,h:1.25*m.legLength,d:.45,color:m.pants},
 {x:-.32*m.bodyWidth,y:.18-swing,z:.20,w:.51,h:.27,d:.7,color:m.hair},
 {x:.32*m.bodyWidth,y:.18+swing,z:.20,w:.51,h:.27,d:.7,color:m.hair},
 {x:-.19*m.headSize,y:3.35,z:.40*m.headSize,w:.13,h:.10,d:.04,color:"#141414"},
 {x:.19*m.headSize,y:3.35,z:.40*m.headSize,w:.13,h:.10,d:.04,color:"#141414"}
 ];
 const faces=parts.flatMap(p=>facesForBox(p.x,p.y,p.z,p.w,p.h,p.d,p.color,yaw,pitch)).sort((a,b)=>a.depth-b.depth);
 for(const face of faces){
  const projected=face.vertices.map(project);
  ctx.beginPath();ctx.moveTo(projected[0].x,projected[0].y);
  projected.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
  ctx.fillStyle=face.color;ctx.fill();
  ctx.strokeStyle="rgba(15,23,42,.18)";ctx.lineWidth=.8;ctx.stroke();
 }
 ctx.font="12px Arial, sans-serif";ctx.fillStyle="rgba(226,232,240,.7)";
 ctx.textAlign="center";ctx.fillText("Kéo để xoay • 3D góc nhìn 360°",w/2,h-18);
}
const colorNames:Record<"skin"|"outfit"|"hair"|"pants",string>={skin:"Da",outfit:"Áo giáp / trang phục",hair:"Tóc",pants:"Quần / giày"};
const scales:Record<"headSize"|"bodyWidth"|"armLength"|"legLength",string>={headSize:"Kích thước đầu",bodyWidth:"Thân rộng",armLength:"Chiều dài tay",legLength:"Chiều dài chân"};
export default function CharacterStudio({id,initialName,initialModel,saved}:{id?:string;initialName:string;initialModel:CharacterModel;saved:boolean}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const grab=useRef<{x:number;y:number;pointerId:number}|null>(null);
 const [model,setModel]=useState<CharacterModel>(initialModel);
 const [name,setName]=useState(initialName);
 const [yaw,setYaw]=useState(.38),[pitch,setPitch]=useState(.10);
 const [walk,setWalk]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  let raf=0;const paint=(time:number)=>{
   render(canvas,model,yaw,pitch,walk?time*.003:0);
   if(walk)raf=requestAnimationFrame(paint);
  };
  raf=requestAnimationFrame(paint);
  const observer=new ResizeObserver(()=>{if(!walk)render(canvas,model,yaw,pitch,0);});
  observer.observe(canvas);
  return ()=>{cancelAnimationFrame(raf);observer.disconnect();};
 },[model,yaw,pitch,walk]);
 const pointerDown=(e:PointerEvent<HTMLCanvasElement>)=>{
  grab.current={x:e.clientX,y:e.clientY,pointerId:e.pointerId};
  e.currentTarget.setPointerCapture(e.pointerId);
 };
 const pointerMove=(e:PointerEvent<HTMLCanvasElement>)=>{
  const p=grab.current;if(!p||p.pointerId!==e.pointerId)return;
  setYaw(v=>v+(e.clientX-p.x)*.012);
  setPitch(v=>clamp(v-(e.clientY-p.y)*.008,-.55,.75));
  grab.current={x:e.clientX,y:e.clientY,pointerId:e.pointerId};
 };
 const pointerEnd=()=>{grab.current=null;};
 const changeColor=(key:keyof Pick<CharacterModel,"skin"|"outfit"|"hair"|"pants">,value:string)=>setModel(m=>({...m,[key]:value}));
 const changeSize=(key:keyof Pick<CharacterModel,"headSize"|"bodyWidth"|"armLength"|"legLength">,value:string)=>setModel(m=>({...m,[key]:Number(value)}));
 const download=()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="studio-character-3d.png";a.click();
  setMessage("Đã xuất ảnh PNG từ góc nhìn hiện tại.");
 };
 return <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
  <section className="overflow-hidden rounded-2xl border border-slate-700 bg-[#142137]">
   <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 p-4"><div><h2 className="flex items-center gap-2 text-sm font-black"><Move3D size={19} className="text-orange-400"/> Cảnh 3D — có thể kéo xoay</h2><p className="mt-1 text-[11px] text-slate-400">Mô hình khối hình học 3D, chiếu phối cảnh và xoay 360°</p></div><button type="button" onClick={()=>setWalk(v=>!v)} className="flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold">{walk?<Pause size={16}/>:<Play size={16}/>} {walk?"Dừng chuyển động":"Chạy animation"}</button></header>
   <canvas ref={canvasRef} aria-label="Bản xem trước nhân vật 3D xoay bằng chuột hoặc cảm ứng" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} style={{touchAction:"none"}} className="block h-[420px] w-full cursor-grab select-none active:cursor-grabbing sm:h-[540px]"/>
   <div className="flex flex-wrap gap-2 border-t border-slate-700 p-3">{[["Trước",0],["Phải",Math.PI/2],["Sau",Math.PI],["Trái",Math.PI*1.5]].map(([label,angle])=><button type="button" key={String(label)} onClick={()=>{setYaw(Number(angle));setPitch(0);}} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:border-orange-400">{label}</button>)}<button type="button" onClick={()=>{setYaw(.3);setPitch(.65);}} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200">Từ trên</button><button type="button" onClick={()=>{setYaw(.38);setPitch(.10);}} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200" title="Đặt lại camera"><RotateCcw size={16}/></button><button type="button" onClick={download} className="ml-auto flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold"><Camera size={16}/> Xuất PNG</button></div>
  </section>
  <aside className="h-max space-y-5 rounded-2xl border border-slate-700 bg-[#1b293d] p-5">
   <div><h2 className="text-base font-black">Thiết kế nhân vật</h2><p className="mt-2 text-xs leading-6 text-slate-400">Thay đổi thông số bên dưới. Kéo lên hình để xem từ các phía.</p></div>
   {saved&&<p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/30 p-3 text-xs text-emerald-200"><CheckCircle2 size={16}/> Đã lưu vào Supabase.</p>}
   <section className="space-y-3"><h3 className="border-b border-slate-700 pb-2 text-xs font-black uppercase tracking-wider text-orange-300">Màu sắc</h3>{(Object.keys(colorNames) as Array<keyof typeof colorNames>).map(key=><label key={key} className="flex items-center justify-between gap-3 text-xs text-slate-300">{colorNames[key]}<span className="flex items-center gap-2"><span className="font-mono text-[10px] text-slate-500">{model[key]}</span><input type="color" aria-label={colorNames[key]} value={model[key]} onChange={e=>changeColor(key,e.target.value)} className="size-10 cursor-pointer rounded-lg border-0 bg-transparent"/></span></label>)}</section>
   <section className="space-y-4"><h3 className="border-b border-slate-700 pb-2 text-xs font-black uppercase tracking-wider text-orange-300">Tỉ lệ cơ thể</h3>{(Object.keys(scales) as Array<keyof typeof scales>).map(key=><label key={key} className="block text-xs text-slate-300"><span className="flex justify-between gap-2">{scales[key]}<span className="font-mono text-orange-200">{model[key].toFixed(2)}×</span></span><input type="range" min=".55" max="1.65" step=".05" value={model[key]} onChange={e=>changeSize(key,e.target.value)} className="mt-2 w-full accent-orange-500"/></label>)}</section>
   <form action={saveCharacter} className="space-y-3 border-t border-slate-700 pt-4"><label className="block text-xs font-bold text-slate-200">Tên nhân vật<input name="name" value={name} onChange={e=>setName(e.target.value)} required maxLength={100} placeholder="Đặt tên nhân vật" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-sm text-white outline-none focus:border-orange-400"/></label><input type="hidden" name="id" value={id??""}/><input type="hidden" name="model" value={JSON.stringify(model)}/><button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 p-3.5 text-sm font-black text-white"><Save size={17}/> {id?"Lưu cập nhật":"Lưu nhân vật mới"}</button></form>
   {id&&<form action={deleteCharacter} onSubmit={e=>{if(!window.confirm("Xóa nhân vật đã lưu này?"))e.preventDefault();}}><input type="hidden" name="id" value={id}/><button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-600/50 p-3 text-xs font-bold text-rose-300"><Trash2 size={16}/> Xóa nhân vật</button></form>}
   {message&&<p role="status" className="rounded-xl bg-slate-900 p-3 text-xs text-emerald-300">{message}</p>}
   <p className="text-[11px] leading-6 text-slate-400">Xưởng này tạo ảnh và dữ liệu mô hình khối 3D. Chưa có xuất glTF, skeletal rig, animation timeline hay runtime 4D–6D.</p>
  </aside>
 </div>;
}
